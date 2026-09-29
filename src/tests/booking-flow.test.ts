import test from "node:test";
import assert from "node:assert/strict";
import { createBookingRepository } from "@/lib/booking-repository";
import { createBookingService, BookingError, bookingFailure } from "@/lib/booking-service";
import { generateSlots } from "@/lib/availability";
import { getEventTypes, getAvailabilityTemplates, bookingRepository, getBookingById, getBookingByToken, getDashboardSnapshot, getPublicBookingPage } from "@/lib/demo-data";
import { createBooking, cancelBooking, getBookingDetail } from "@/lib/mock-services";
import { canTransitionBooking } from "@/lib/booking-state";
import type { Booking, BookingStatus } from "@/lib/domain";

const now = new Date("2026-09-21T08:00:00Z");
function fixture() {
  const event = { ...structuredClone(getEventTypes()[0]), timezone: "UTC", published: true,
    durationMinutes: 30, slotIntervalMinutes: 30, minNoticeMinutes: 0, maxDaysInFuture: 30,
    bufferBeforeMinutes: 0, bufferAfterMinutes: 0 };
  const other = { ...event, id: "different-event" };
  const template = { ...structuredClone(getAvailabilityTemplates()[0]), organizerId: event.organizerId,
    timezone: "UTC", weeklyRules: Array.from({length:7}, (_,dayOfWeek) => ({ dayOfWeek, ranges: [{startTime:"09:00",endTime:"18:00"}] })) };
  const repository = createBookingRepository({bookings:[],attendees:[]});
  const options = { repository, events:[event,other], templates:[template], overrides:[],blockedTimes:[],clock:()=>now };
  return { event, other, template, repository, options, service: createBookingService(options),
    input: {eventTypeId:event.id, startTime:"2026-09-21T10:00:00Z",attendeeName:"Guest",attendeeEmail:"guest@example.com"} };
}
function error(status: number) { return (value: unknown) => value instanceof BookingError && value.status === status; }

test("create, detail, token, dashboard and preview share the actual demo repository", () => {
  bookingRepository.reset();
  try {
    const event = getEventTypes().find(event => event.published)!;
    const slot = getPublicBookingPage(event.profileSlug,event.slug)!.slots[0]; assert.ok(slot);
    const result = createBooking({ eventTypeId:event.id,startTime:slot.startTime,attendeeName:"Integration Guest",attendeeEmail:"flow@example.com" });
    assert.equal(getBookingById(result.booking.id)?.status,"confirmed");
    assert.equal(getBookingByToken(result.booking.confirmationToken)?.id,result.booking.id);
    assert.equal(getBookingDetail(result.booking.id)?.attendees[0].email,"flow@example.com");
    assert.ok(getDashboardSnapshot().upcomingBookings.some(item=>item.id===result.booking.id));
    assert.ok(!getPublicBookingPage(event.profileSlug,event.slug)!.slots.some(item=>item.startTime===slot.startTime));
    cancelBooking(result.booking.id,"Changed plans",result.booking.confirmationToken);
    assert.equal(getBookingById(result.booking.id)?.status,"canceled");
    assert.ok(getPublicBookingPage(event.profileSlug,event.slug)!.slots.some(item=>item.startTime===slot.startTime));
  } finally { bookingRepository.reset(); }
});
test("reads and returned values cannot mutate retained state; transaction throws roll back",()=>{
  const f=fixture(); const result=f.service.create(f.input); result.booking.title="changed";
  const state=f.repository.read(); state.bookings[0].title="changed";
  assert.notEqual(f.repository.read().bookings[0].title,"changed");
  assert.throws(()=>f.repository.transaction(draft=>{draft.bookings.length=0;throw new Error("fail");}));
  assert.equal(f.repository.read().bookings.length,1); f.repository.reset();assert.deepEqual(f.repository.read(),{bookings:[],attendees:[]});
});
for (const input of [null, [], {}, {eventTypeId:42}, {eventTypeId:"x"}, {startTime:"invalid"}, {startTime:"2026-09-21T10:00:00"}, {attendeeEmail:"invalid"}, {attendeeName:" "}]) {
  test(`invalid create leaves state unchanged: ${JSON.stringify(input)}`,()=>{
    const f=fixture();const value=input && !Array.isArray(input) && Object.keys(input).length > 0 ? {...f.input,...input} : input;
    assert.throws(()=>f.service.create(value), (e: unknown)=>e instanceof BookingError && [400,404].includes(e.status));
    assert.equal(f.repository.read().bookings.length,0);
  });
}
test("unpublished event and off-grid, outside hours, past and insufficient-notice times fail",()=>{
  const f=fixture();f.event.published=false;assert.throws(()=>f.service.create(f.input),error(404));f.event.published=true;
  for(const startTime of ["2026-09-21T10:07:00Z","2026-09-21T19:00:00Z","2026-09-20T10:00:00Z","2026-11-21T10:00:00Z"])
    assert.throws(()=>f.service.create({...f.input,startTime}),error(409));
  f.event.minNoticeMinutes=180;assert.throws(()=>f.service.create(f.input),error(409));
});
test("one organizer cannot overlap event types and both event buffers apply",()=>{
  const f=fixture();f.event.bufferAfterMinutes=30;f.other.bufferBeforeMinutes=15;f.service.create(f.input);
  for(const startTime of ["2026-09-21T10:00:00Z","2026-09-21T11:00:00Z"])
    assert.throws(()=>f.service.create({...f.input,eventTypeId:f.other.id,startTime}),error(409));
  f.service.create({...f.input,eventTypeId:f.other.id,startTime:"2026-09-21T11:30:00Z"});
  assert.equal(f.repository.read().bookings.length,2);
});
test("invalid reschedule is atomic; valid replacement rotates token, links attendees, refreshes timestamps",()=>{
  const f=fixture();const {booking}=f.service.create(f.input); const before=f.repository.read();
  assert.throws(()=>f.service.reschedule(booking.id,"2026-09-21T19:00:00Z",booking.confirmationToken),error(409));
  assert.deepEqual(f.repository.read(),before);
  f.options.clock=()=>new Date("2026-09-21T08:30:00Z");const service=createBookingService(f.options);
  const result=service.reschedule(booking.id,"2026-09-21T11:00:00Z",booking.confirmationToken);
  assert.equal(result.previous.status,"canceled");assert.equal(result.replacement.rescheduledFromBookingId,booking.id);
  assert.notEqual(result.replacement.confirmationToken,booking.confirmationToken);assert.notEqual(result.replacement.createdAt,booking.createdAt);
  assert.equal(f.repository.read().attendees.filter(item=>item.bookingId===result.replacement.id)[0].email,f.input.attendeeEmail);
  assert.throws(()=>service.cancel(result.replacement.id,"cancel",booking.confirmationToken),error(403));
  assert.throws(()=>service.confirm(booking.id,booking.confirmationToken),error(409));
});
test("reschedule can keep its own offered slot without conflicting with itself",()=>{
 const f=fixture();const {booking}=f.service.create(f.input);assert.equal(f.service.reschedule(booking.id,f.input.startTime,booking.confirmationToken).replacement.startTime,booking.startTime);
});
test("token and guest flags protect all mutators; terminal confirmations and blank reasons fail",()=>{
 const f=fixture();const {booking}=f.service.create(f.input);
 for(const action of [()=>f.service.confirm(booking.id,"wrong"),()=>f.service.cancel(booking.id,"cancel",null),()=>f.service.reschedule(booking.id,f.input.startTime,undefined)]) assert.throws(action,error(403));
 assert.equal(f.service.confirm(booking.id,booking.confirmationToken).status,"confirmed");
 assert.throws(()=>f.service.cancel(booking.id," ",booking.confirmationToken),error(400));
 f.repository.transaction(state=>{state.bookings[0].guestCanCancel=false;state.bookings[0].guestCanReschedule=false;});
 assert.throws(()=>f.service.cancel(booking.id,"cancel",booking.confirmationToken),error(403));
 assert.throws(()=>f.service.reschedule(booking.id,f.input.startTime,booking.confirmationToken),error(403));
 assert.throws(()=>f.service.confirm("absent","token"),error(404));
 for(const status of ["canceled","completed","no_show"] as BookingStatus[]) {
  f.repository.transaction(state=>{state.bookings[0].status=status;});assert.throws(()=>f.service.confirm(booking.id,booking.confirmationToken),error(409));
 }
 assert.equal(canTransitionBooking("toString" as BookingStatus,"confirmed"),false);
 assert.deepEqual(bookingFailure(new Error("private detail")),{status:500,message:"Unable to complete booking request."});
});
test("slot grid survives clipped range, overlapping windows deduplicate, invalid intervals never loop",()=>{
 const f=fixture();const parameters={ eventType:f.event,template:f.template,overrides:[],blockedTimes:[],bookings:[] as Booking[],rangeStart:new Date("2026-09-21T09:07:00Z"),rangeEnd:new Date("2026-09-21T12:00:00Z"),now };
 f.template.weeklyRules[1].ranges.push({startTime:"09:00",endTime:"12:00"});
 const slots=generateSlots(parameters);assert.equal(slots[0].startTime,"2026-09-21T09:30:00.000Z");assert.equal(new Set(slots.map(slot=>slot.startTime)).size,slots.length);
 for(const interval of [0,-1,NaN,Infinity,0.5]) assert.throws(()=>generateSlots({...parameters,eventType:{...f.event,slotIntervalMinutes:interval}}),RangeError);
 assert.throws(()=>generateSlots({...parameters,rangeEnd:new Date("invalid")}),RangeError);
 assert.throws(()=>generateSlots({...parameters,eventType:{...f.event,durationMinutes:0}}),RangeError);
});


test("real HTTP handlers classify bad input, missing resources, bad tokens and terminal conflicts",async()=>{
 const {NextRequest}=await import("next/server");
 const createRoute=await import("@/app/api/bookings/route");
 const cancelRoute=await import("@/app/api/bookings/[bookingId]/cancel/route");
 const confirmRoute=await import("@/app/api/bookings/[bookingId]/confirm/route");
 const rescheduleRoute=await import("@/app/api/bookings/[bookingId]/reschedule/route");
 const request=(body:unknown)=>new NextRequest("http://localhost/api/bookings",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});
 bookingRepository.reset();
 try {
  assert.equal((await createRoute.POST(request({}))).status,400);
  const event=getEventTypes().find(item=>item.published)!;const slot=getPublicBookingPage(event.profileSlug,event.slug)!.slots[0];
  const response=await createRoute.POST(request({eventTypeId:event.id,startTime:slot.startTime,attendeeName:"HTTP Guest",attendeeEmail:"http@example.com"}));assert.equal(response.status,201);
  const booking=bookingRepository.read().bookings.find(item=>item.title.includes("HTTP Guest"))!;
  const context={params:Promise.resolve({bookingId:booking.id})};
  assert.equal((await cancelRoute.POST(request({reason:"cancel"}),context)).status,403);
  assert.equal((await rescheduleRoute.POST(request({confirmationToken:booking.confirmationToken}),context)).status,400);
  assert.equal((await cancelRoute.POST(request({reason:"cancel",confirmationToken:booking.confirmationToken}),context)).status,200);
  assert.equal((await confirmRoute.POST(request({confirmationToken:booking.confirmationToken}),context)).status,409);
  assert.equal((await confirmRoute.POST(request({confirmationToken:"token"}),{params:Promise.resolve({bookingId:"absent"})})).status,404);
 } finally {bookingRepository.reset();}
});
