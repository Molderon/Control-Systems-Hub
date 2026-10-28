# Role & Objective
Act as a Senior Full-Stack Web Engineer. You are tasked with implementing feature updates, UI/UX refinements, and fallback states for the repository. 

Before making any modifications, **explore the existing codebase structure, styling conventions, component patterns, and layout systems** to ensure seamless integration. Align all new UI elements with a professional aesthetic inspired by the typography and clean design systems of Kali Linux (kali.org) and Cloudflare (cloudflare.com).

---

## Task Breakdown

### 1. Blog Section & Popup (`SIGNAL_CHANNEL://Blog.INIT`)
- **Visual Distinction:** Update the `SIGNAL_CHANNEL://Blog.INIT` popup to clearly distinguish between the two unique user roles: **Reader** and **Author**.
- **Layout & Ordering:** 
  - Place the primary action (**Open Blog**) at the top.
  - In the lower section, bundle **Register for Notifications** and **Article Submission** together, visually indicating them as alternative ways to engage with the blog.
- **Button Refinement:** Soften the sharp edges of the Article Submission button and add an inviting visual highlight or subtle animation to draw attention.

### 2. About Section Footer
- Append the official footer to the About section containing exactly this text:
  `© 2026 Technical University of Sofia, branch Plovdiv. | All rights reserved (mostly).`

### 3. Laboratory Section Enhancements
- **Dynamic Section Titles:** Make the Laboratory section title dynamically update based on the active menu topic (e.g., *Domain, Publications, Home Brew, Hackathon, Research*), matching its respective thematic color.
- **Publications Overlay:** Add a tiny hover overlay to items in the Publications section (matching the style of the Domain components). The overlay must display:
  - An abstract of **max 50 words**
  - Date of publication
  - Field/category (using the available categories from Domains)
- **Home Brew Cards:** Update the Home Brew cards so their visual affordance clearly signals that clicking them leads to an external repository of suggested projects.

### 4. Ph.D. Students Section Refinements
- **Roster Toggle:** Fix the roster button functionality so it reliably opens and closes the student cards.
- **Appointments Update:** Remove the working hours display and replace it with a **"By Appointment"** link that redirects the user directly to the **Message Us** section.
- **Card Redesign:** Rework the student info cards to uphold a cleaner, more professional approach to information hierarchy and layout.

### 5. Message Us Section
- **API Key Update:** Update the integration with the new Carto.com API key.
- **Map Illustration Framing:** Zoom in slightly on the map illustration / adjust the frame boundaries to cleanly crop out the Ukrainian flag from the rendered view.

### 6. IRC Room Overhaul
- **Aesthetic Alignment:** Drop the default "green terminal" retro style. Rework the IRC chatroom to match the main website's core visual language, color palette, and cyberpunk aesthetics.
- **Viewport & Layout Fit:** 
  - Ensure the entire IRC page fits within a standard viewport height **without requiring vertical scrolling**.
  - Increase the horizontal space allocated to the IRC window.
  - Implement a **Full-Screen Expand Button** that lets users maximize the IRC interface.

### 7. New Feature: Backend-Disconnected Condensed Fallback
- Implement a lightweight, condensed fallback version of the website that renders automatically *only* if the backend is disconnected or unreachable.
- This condensed view should display core static data, essential illustrative information, and a clear side notification stating that the website is currently under development.

### 8. New Feature: Website Opening Curtain & Theme Toggle
- **Opening Curtain:** Replace the direct rendering of `index.html` with an initial landing curtain page. The page must display the site name and the subtitle: `'digital campfire'`.
- **UI/UX Switcher:** Include an interactive toggle button on the canvas that allows users to switch between two distinct UI/UX styles before entering the site:
  1. **Standard Community Forum** outlook
  2. **Cyberpunk** outlook (current style)

---

## Verification & Completion
After applying all changes:
1. Run your project's build and lint checks (e.g., `npm run build`, `npm run lint`, or equivalent) to confirm zero compilation errors or broken imports.
2. Verify that responsive layouts remain intact across screen sizes.
