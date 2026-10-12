# API contract

Base path: `/api/v1`. Send JSON and `Authorization: Bearer <token>` to protected endpoints. Login returns `{token, employee, role}`. Errors use `{message}`. Paged responses use `{content, totalElements, totalPages, number, size}` with page 0 by default, size 20, and a maximum size of 100. Sorting fields are selected by the controller rather than arbitrary client SQL paths.

| Method    | Path                                                          | Role / operation                                        |
| --------- | ------------------------------------------------------------- | ------------------------------------------------------- |
| POST      | `/auth/login`                                                 | Public; `{email,password}`; guarded per account/IP      |
| POST      | `/auth/logout`                                                | Authenticated; revoke all account tokens                |
| GET       | `/auth/me`                                                    | Authenticated; public employee profile                  |
| GET, POST | `/admin/employees`                                            | Admin; paginated search / create employee and ten tasks |
| GET       | `/admin/events`                                               | Admin; paginated upcoming events                        |
| GET       | `/admin/onboarding`                                           | Admin; paginated candidates with bounded task summaries |
| PATCH     | `/admin/tasks/{id}`                                           | Admin; `{done}`                                         |
| GET       | `/admin/leaves`                                               | Admin; paginated requests                               |
| PATCH     | `/admin/leaves/{id}`                                          | Admin; `{status: "Approved" or "Rejected"}`             |
| GET       | `/admin/attendance`                                           | Admin; paginated attendance                             |
| GET       | `/admin/attendance/timeline?from=YYYY-MM-DD&until=YYYY-MM-DD` | Admin; date-overlap calendar data                       |
| GET       | `/admin/telemetry?employeeId=UUID`                            | Admin; paginated aggregate activity                     |
| POST      | `/employee/attendance/clock-in`                               | Own account; atomic open shift                          |
| POST      | `/employee/attendance/clock-out`                              | Own account; finish active shift                        |
| GET       | `/employee/attendance/current`                                | Own account; shift or HTTP 204                          |
| GET       | `/employee/attendance`                                        | Own account; paginated history                          |
| GET, POST | `/employee/leaves`                                            | Own account; list / request time off                    |
| GET       | `/employee/tasks`                                             | Own account; onboarding checklist                       |
| PATCH     | `/employee/tasks/{id}`                                        | Own task only; `{done}`                                 |
| POST      | `/employee/telemetry`                                         | Own account; deduplicated activity batch                |
| POST      | `/employee/assets/upload-url`                                 | Optional S3 direct-upload contract                      |

Create employee: `{name,email,title,department,password}`. Leave request: `{type,startDate,endDate,reason?}`. The authenticated account supplies ownership; a client-provided employee ID cannot impersonate another employee. Leave types are `Vacation`, `Paid leave`, `Sick leave`. End dates must follow start dates and fall within one year. Overlapping pending/approved requests return 409. Review conflicts return 409.

Telemetry: `{batchId,startedAt,endedAt,keyboardEvents,mouseEvents,idleSeconds,screenshotUrl?}`. Timestamps are UTC ISO instants; the interval must be recent, nonnegative, within two days, no longer than one day, and entirely contained in a clocked-in shift. Counts are bounded. Duplicate `(employee,batchId)` submissions are safe retries. Image bytes are never accepted by the API. Optional asset URLs must belong to the configured bucket and user prefix.

Health: `GET /actuator/health` returns public coarse health. Prometheus metrics at `/actuator/prometheus` require an administrator token.
