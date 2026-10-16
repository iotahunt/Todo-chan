# Security Specification for Todo-chan

## 1. Data Invariants

1. **User Identity & Reservation Invariant**: A user profile cannot be registered without an atomic username reservation. Once created, `normalizedUsername` and `username` cannot be reassigned or spoofed.
2. **List Ownership Invariant**: A to-do list has an immutable `ownerId` and `listId`. Only the verified list owner can alter credentials (`viewPasswordHash`, `editPasswordHash`, `editPasswordSalt`, `viewPasswordSalt`), delete the list, or modify permissions and sharing toggles.
3. **Two-Level Password & Membership Invariant**: 
   - View Password grants ONLY `role: 'viewer'`. Viewers cannot create, edit, or delete tasks, nor change priorities, assignees, or dates.
   - Edit Password grants `role: 'editor'`. Editors can mutate tasks and post comments, but cannot modify list settings, change passwords, or revoke access.
   - A viewer cannot escalate their own membership to editor or owner without server-side credential verification.
4. **Task Integrity Invariant**: Every task must be linked to a valid `listId`. Mutations (create, update, delete) on tasks are only allowed by authenticated list owners or editors with an active, non-revoked membership.
5. **Private Notes Invariant**: Private notes (`notesPrivate: true`) are restricted to the task creator or assignees.
6. **Chat Integrity Invariant**: Real-time chat messages require `chatEnabled: true` on the list AND `canChat: true` on the sender's membership record.
7. **Rate Limiting & Brute-Force Invariant**: Password verification attempts are rate-limited on the backend. No client-side plaintext password comparisons are permitted.

## 2. The "Dirty Dozen" Attack Payloads (Must Be Rejected)

1. **Payload 1 (Viewer Privilege Escalation)**: Viewer directly updating their membership role from `viewer` to `editor` or `owner`.
2. **Payload 2 (Ghost Field Injection)**: Injecting unauthorized fields (e.g. `isAdmin: true` or `isSuperUser: true`) into user or membership records.
3. **Payload 3 (Owner Hijack)**: Changing `ownerId` of a list to take over another user's list.
4. **Payload 4 (Direct Password Tampering)**: Non-owner client attempting to write or overwrite `editPasswordHash` or `viewPasswordHash`.
5. **Payload 5 (Viewer Task Creation)**: User with `role: 'viewer'` attempting to write a new document into `/tasks/`.
6. **Payload 6 (Viewer Task Deletion)**: User with `role: 'viewer'` attempting to delete an existing task.
7. **Payload 7 (Predictable List ID Probing)**: Client attempting blanket collection queries (`list`) over `/lists/` without being owner or member.
8. **Payload 8 (Chat Bypass)**: Viewer posting a message into `/messages/` when `chatEnabled: false` or `canChat: false`.
9. **Payload 9 (Private Note Exfiltration)**: Viewer attempting to read notes marked `notesPrivate: true` where `allowViewerNotes: false`.
10. **Payload 10 (Revoked Member Write)**: Member with `revoked: true` attempting to add a comment or update task status.
11. **Payload 11 (Huge Payload / Denial of Wallet)**: Injecting 2MB string into task description or title to cause storage and render griefing.
12. **Payload 12 (Timestamp Spoofing)**: Submitting arbitrary past or future client timestamps for `createdAt` instead of server-verified time.
