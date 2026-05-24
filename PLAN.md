# Project Plan: Iglesia Bautista Emanuel Hartford Website

## 1. Vision & Tone
- **Aesthetic**: Peaceful, welcoming, professional, and elegant.
- **Typography**: `Playfair Display` (Serif) for headings to evoke tradition and reverence. `Inter` (Sans-serif) for body text to ensure readability.
- **Color Palette**: White, light cream, subtle gold/bronze accents, and deep navy or forest green for contrast.

## 2. Navigation Structure
- **Home**: Hero section, quick info, current service times.
- **About Us (Quiénes Somos)**: Mission, vision, core beliefs.
- **Our History (Nuestra Historia)**: Chronology of the church.
- **Ministries (Ministerios)**: Children, youth, adults, music, etc.
- **Pastor**: Biography and message from the lead pastor.
- **Events (Eventos)**: Dynamic list of upcoming activities.
- **Gallery (Galería)**: Media wall of photos and videos.
- **Admin**: Dashboard to manage all dynamic content (Services, Events, Gallery, Settings).

## 3. Technical Stack
- **Frontend**: React 19, Tailwind CSS 4, Framer Motion for subtle transitions.
- **Backend/Storage**: Firebase (Firestore/Auth).
- **Icons**: Lucide React.

## 4. Database Schema (Firestore)
- `settings/main`: General info (Name, address, phone).
- `services`: Collection of weekly service schedules.
- `events`: Collection of upcoming and past events with images.
- `gallery`: Collection of media items (photos/videos).

## 5. Development Phases
1. **Infrastructure**: Provision Firebase and set up the blueprint.
2. **Layout**: Create the core navigation, footer, and responsive shell.
3. **Frontend Components**: Build the individual pages (Home, About, Pastor, etc.).
4. **Data Integration**: Connect Firebase hooks to update the UI dynamically.
5. **Admin Functionality**: Implement forms to allow the church staff to edit content.
6. **Refinement**: Polish animations and accessibility.
