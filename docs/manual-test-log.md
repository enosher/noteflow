# NoteFlow - Manual System Test Log

**Date:** 23 June 2026
**Tester:** Spencer Ting
**Environment:** Localhost / Preview

## Severity policy

- **S1 - demo path broken** (auth, module/topic/note CRUD, quiz, review, recommendation): fix before feature freeze, retest, link the fix PR in the log.
- **S2 - wrong but avoidable**: fix if under 1 hour, otherwise document in Known Issues with a workaround.
- **S3 - cosmetic**: document in Known Issues. No code changes after freeze.

## Test Cases

| ID       | Category  | Scenario                                       | Steps to Reproduce                                               | Expected Result                                 | Actual Result  | Pass/Fail | Screenshot                           |
| :------- | :-------- | :--------------------------------------------- | :--------------------------------------------------------------- | :---------------------------------------------- | :------------- | :-------: | :----------------------------------- |
| AUTH-01  | Auth      | Sign up with valid email/password              | 1. Go to `/login`<br>2. Enter new email/pwd<br>3. Click Sign Up  | Account created, redirected to Dashboard        | (Fill this in) |    ⚪️     | [Link](./images/testing/auth-01.png) |
| AUTH-02  | Auth      | Sign up with already-used email                | 1. Go to `/login`<br>2. Enter existing email<br>3. Click Sign Up | Error shown, stays on signup page               |                |    ⚪️     |                                      |
| AUTH-03  | Auth      | Login with wrong password                      |                                                                  | Error shown                                     |                |    ⚪️     |                                      |
| AUTH-04  | Auth      | Visit `/dashboard` while signed out            |                                                                  | Redirected to `/login`                          |                |    ⚪️     |                                      |
| AUTH-05  | Auth      | Visit `/login` while signed in                 |                                                                  | Redirected to `/dashboard`                      |                |    ⚪️     |                                      |
| MOD-01   | Modules   | Create module with valid code+name             |                                                                  | Appears in list                                 |                |    ⚪️     |                                      |
| MOD-02   | Modules   | Create module with empty name                  |                                                                  | Blocked, error shown                            |                |    ⚪️     |                                      |
| MOD-03   | Modules   | Edit module                                    |                                                                  | Changes reflected on list and detail page       |                |    ⚪️     |                                      |
| MOD-04   | Modules   | Delete module                                  |                                                                  | Module and its nested topics are deleted        |                |    ⚪️     |                                      |
| TOPIC-01 | Topics    | Create topic under a module                    |                                                                  | Appears on module detail                        |                |    ⚪️     |                                      |
| TOPIC-02 | Topics    | Create subtopic under a topic                  |                                                                  | Appears on topic detail                         |                |    ⚪️     |                                      |
| TOPIC-03 | Topics    | Delete topic                                   |                                                                  | Topic, its subtopics, and notes cascade-delete  |                |    ⚪️     |                                      |
| NOTE-01  | Notes     | Create note attached to a topic (no subtopic)  |                                                                  | Saves correctly                                 |                |    ⚪️     |                                      |
| NOTE-02  | Notes     | Create note attached to a subtopic             |                                                                  | Saves correctly                                 |                |    ⚪️     |                                      |
| NOTE-03  | Notes     | Try creating note with both topic AND subtopic |                                                                  | Blocked by UI/Server                            |                |    ⚪️     |                                      |
| NOTE-04  | Notes     | Import via markdown paste                      |                                                                  | Content renders correctly                       |                |    ⚪️     |                                      |
| NOTE-05  | Notes     | Upload a file with a note                      |                                                                  | File accessible after save (signed URL working) |                |    ⚪️     |                                      |
| QUIZ-01  | Quiz      | Create MCQ question with options               |                                                                  | Quiz shows the options correctly                |                |    ⚪️     |                                      |
| QUIZ-02  | Quiz      | Create short-answer question                   |                                                                  | Case-insensitive matching works on attempt      |                |    ⚪️     |                                      |
| QUIZ-03  | Quiz      | Create long-answer question                    |                                                                  | Always marked correct on attempt (by design)    |                |    ⚪️     |                                      |
| QUIZ-04  | Quiz      | Answer correctly and incorrectly               |                                                                  | Both recorded accurately in `quiz_attempts`     |                |    ⚪️     |                                      |
| QUIZ-05  | Quiz      | Finish quiz                                    |                                                                  | Results screen shows accurate score             |                |    ⚪️     |                                      |
| DASH-01  | Dashboard | Empty state (no attempts yet)                  |                                                                  | Reads sensibly, no "0 attempts" everywhere      |                |    ⚪️     |                                      |
| DASH-02  | Dashboard | Weak topic appears (3+ attempts, <60%)         |                                                                  | Topic listed in Weak Topics section             |                |    ⚪️     |                                      |
| DASH-03  | Dashboard | Floor test (2 attempts, <60%)                  |                                                                  | Does _not_ appear as weak yet                   |                |    ⚪️     |                                      |
| DASH-04  | Dashboard | Recommendation card                            |                                                                  | Links directly to the right topic's quiz        |                |    ⚪️     |                                      |
| REV-01   | Review    | Open /review with cards due                    | Seed demo account, visit /review                                 | Queue shows due cards with count                 |                |    ⚪️     |                                      |
| REV-02   | Review    | Grade a card correct                           | Answer/reveal, mark correct                                      | Card leaves queue, count drops, due_at pushed out|                |    ⚪️     |                                      |
| REV-03   | Review    | Grade a card incorrect                         | Mark incorrect                                                   | Interval resets short (due again soon)           |                |    ⚪️     |                                      |
| REV-04   | Review    | Finish the queue                               | Grade all cards                                                  | Completion state with session count              |                |    ⚪️     |                                      |
| REC-01   | Recommend | Recommendation targets weak topic              | Demo account, open dashboard recommendation                      | Links to a Recursion (weak topic) quiz           |                |    ⚪️     |                                      |
| GRAPH-01 | Graph     | Add a prerequisite edge                        | Graph page: click topic A then topic B                           | Edge renders, persists on reload                 |                |    ⚪️     |                                      |
| GRAPH-02 | Graph     | Create a cycle                                 | Try to make A require B and B require A                          | Blocked with a clear message                     |                |    ⚪️     |                                      |
| GRAPH-03 | Graph     | Weak prerequisite gates a topic                | Demo account CS2030S graph                                       | Streams shown gated behind weak Recursion        |                |    ⚪️     |                                      |
| AI-01    | AI gen    | Generate questions from a note                 | Note with content > Generate questions                           | Valid questions appear for review before saving  |                |    ⚪️     |                                      |
| AI-02    | AI gen    | Generation failure handled                     | Trigger with API failure (e.g. bad key locally)                  | Friendly error, no crash, no partial rows        |                |    ⚪️     |                                      |
| THEME-01 | Theme     | Dark mode toggle                               | Toggle theme, reload, revisit                                    | Preference persists, no unreadable contrast      |                |    ⚪️     |                                      |
| ONBRD-01 | Onboard   | Getting-started checklist progresses           | Fresh account: complete first steps                              | Checklist items tick off as actions complete     |                |    ⚪️     |                                      |

_(Note: Change ⚪️ to ✅ for Pass, or ❌ for Fail. Add screenshots to the `docs/images/testing/` folder and link them)._

## Known Issues

| ID | Found by case | Severity | Description | Decision & rationale |
| :- | :------------ | :------- | :---------- | :-------------------- |
