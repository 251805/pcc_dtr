# Theory11 - Attendance System Architecture & Logic Review

## Overview
**Theory11** is designed to be a robust, mobile-first Progressive Web App (PWA) for managing employee attendance. Based on the guidelines in `A102.txt` and the reference logic in `A101.txt`, we are bridging a legacy Google Apps Script (GAS) architecture into a modern, production-ready stack using **Supabase** (PostgreSQL + Auth + API) and a lightweight frontend (Vanilla JS / React + Tailwind CSS).

---

## 1. Core Mechanisms & Logic Breakdown

### 1.1 In/Out Logging & Duplicate Punch Prevention
*   **Logic (from A101):** When a user inputs their Employee ID (EID) and clicks IN or OUT, the system records the timestamp. A 60-second cooldown is enforced.
*   **Purpose:** Prevents accidental double-taps or intentional spamming of the attendance log.
*   **Modernization:** We will store the `lastLogTime` in browser `localStorage` or memory, but enforce final validation on the Supabase/Server side to prevent manipulation. 

### 1.2 Offline Resilience (PWA)
*   **Logic:** If `navigator.onLine` is false, standard network requests fail. We will intercept this and save the `[EID, Type, Timestamp, Remarks]` payload to a local queue (`localStorage` or IndexedDB).
*   **Purpose:** Crucial for physical work environments where Wi-Fi or mobile data can be spotty. Employees can still punch in, and the system will automatically sync (`flushQueue()`) to Supabase the moment the connection is restored.

### 1.3 Automated Shift Detection & Calculations
*   **Logic:** When an IN punch is received, the system evaluates the time against 4 predefined shifts:
    *   06:00 AM - 02:00 PM (Morning)
    *   08:00 AM - 05:00 PM (Regular)
    *   02:00 PM - 10:00 PM (Afternoon)
    *   10:00 PM - 06:00 AM (Night)
*   **Purpose:** The closest shift determines the "expected" start and end times. 
    *   *Tardiness* = `Actual IN` - `Expected IN` (if positive).
    *   *Undertime* = `Expected OUT` - `Actual OUT` (if positive).
    *   *Total Hours* = `Actual OUT` - `Actual IN` (capped or adjusted based on rules).

### 1.4 Admin Security Tiers & Access
*   **Logic:** 
    *   **Root (lee):** Full CRUD on all tables, device unbinding, and admin account creation.
    *   **Teams (admin):** CRUD on employees only, restricted from admin configuration.
*   **Purpose:** Segregation of duties. We will handle this using a custom login modal that verifies credentials against a secure Supabase `admin_users` table (or server-side env vars), issuing a JWT for session management.

### 1.5 Database Architecture (Supabase)
We will map the GAS Sheet columns to a strict relational PostgreSQL schema:
*   **`employees` (Seed Directory):** `eid` (PK), `name`, `rate_per_day`, `philhealth`.
*   **`attendance_logs`:** `id` (PK, Serial), `eid` (FK), `date`, `time_in`, `time_out`, `remarks`, `tardiness`, `undertime`.

---

## 2. UI/UX Strategy (Facebook Vibe)
*   **Color Palette:** Bright, clean containers with a blue-and-gray scheme to mimic Facebook's accessible, high-contrast, non-fatiguing interface.
*   **Structure:** Single-view mobile-first layout. The main screen is dedicated solely to logging IN/OUT (with QR code scanner integration if requested). Admin and Reports are hidden behind modal authorization doors.
*   **Interactivity:** Smooth transitions for the In/Out feedback states ("Your Log In was recorded successfully"). 

---

## 3. Implementation Plan (Awaiting Your Go-Ahead)

Since you asked me to review, comment on the logic, and **wait for your instructions**, here is the roadmap once you give the signal:

1.  **Phase 1: Database & Backend Setup**
    *   Initialize the Supabase client connection (using the provided Anon Key/URL).
    *   Write the SQL schema definitions for the `employees` and `attendance_logs` tables.
2.  **Phase 2: UI Foundation & PWA**
    *   Build the mobile-first UI with Tailwind CSS.
    *   Implement the Facebook UI vibe (bright colors, rounded containers).
    *   Set up the PWA Manifest and Service Worker for caching and offline support.
3.  **Phase 3: Core Logic Integration**
    *   Implement the In/Out mechanics, duplicate prevention, and the offline queuing system.
    *   Add the auto-shift detection algorithms for calculating Tardiness/Undertime.
4.  **Phase 4: Admin & Reporting**
    *   Build the Admin Login modal.
    *   Implement the CRUD data table for employees.
    *   Implement the Report generation logic (Print layout, CSV Export).

I am ready to begin. Should we start with **Phase 1 and 2** (Database Hookup & Frontend Layout)? Also, while you requested Vanilla JS, the current environment has a React + Vite boilerplate which is exceptionally good for building PWAs and managing offline state. Let me know if you are okay with React, or if you strictly prefer me to strip it down to pure Vanilla JS!
