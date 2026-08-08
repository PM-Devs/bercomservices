/**
 * One-time migration: seeds MongoDB with the exact content that currently lives in the
 * static index.html / about.html / services.html / courses.html / team.html /
 * testimonials.html / contact.html files, transcribed directly (not scraped) so nothing
 * is lost or garbled. Safe to re-run — it's a no-op if Pages already exist.
 */
require('dotenv').config();
const connectDB = require('../config/db');

const Page = require('../models/Page');
const SiteSettings = require('../models/SiteSettings');
const Service = require('../models/Service');
const Course = require('../models/Course');
const TeamMember = require('../models/TeamMember');
const Testimonial = require('../models/Testimonial');
const Client = require('../models/Client');
const IsoStandard = require('../models/IsoStandard');

const services = [
    {
        slug: 'offshore', order: 0, icon: 'directions_boat', title: 'Offshore Support Vessels',
        shortDescription: 'Large fleet providing comprehensive offshore logistics and operational support for oil & gas installations.',
        longDescription: 'BerCom operates a comprehensive fleet providing immediate responsiveness and efficient logistics for the most demanding offshore operations. Full coverage from anchor handling to diving support.',
        bulletGroups: [{ subheading: 'Fleet Types', items: ['AHTS — Anchor Handling Tug Supply', 'PSV — Platform Supply Vessel', 'CSV — Crew Support Vessels', 'LHTS — Line Handling Tug Supply', 'FSIV — Fast Support Intervention Vessels', 'DSV — Diving Support Vessels'] }]
    },
    {
        slug: 'chandelling', order: 1, icon: 'inventory_2', title: 'Ship Chandelling',
        shortDescription: 'Quality, fast and dependable supply for vessels — consumable and non-consumable goods delivered via efficient logistics.',
        longDescription: 'Quality, fast and reliable supply at any time — conforming to international standards. Steadfast stock and delivery systems ensure your vessels never wait.',
        bulletGroups: [
            { subheading: 'Consumable Goods', items: ['Provisions, vegetables, fresh meat & water', 'Oils, food items and general consumables'] },
            { subheading: 'Non-Consumables & Technical', items: ['Equipment and spare parts supply', 'Refilling of Ship Bottles — Oxygen & Acetylene', 'Fire extinguisher servicing & recharge'] }
        ]
    },
    {
        slug: 'manpower', order: 2, icon: 'groups', title: 'Manpower Supply',
        shortDescription: 'Specialist recruitment across all disciplines for oil & gas, energy and general construction — accessing a rapidly expanding local candidate database.',
        longDescription: 'Specialist recruitment support for Oil & Gas, Energy and General Construction clients. BerCom maintains a rapidly expanding database of locally available candidates across all disciplines and skill sets.',
        bulletGroups: [{ subheading: 'Sectors Served', items: ['Oil & Gas — on/offshore technical disciplines', 'Energy sector & general construction', 'HSE & Quality Assurance specialists', 'Commercial, administrative & support staff', 'Rapidly expanding local candidate database'] }]
    },
    {
        slug: 'qhse', order: 3, icon: 'health_and_safety', title: 'QHSE Training & Consultancy',
        shortDescription: 'Frontrunner in Occupational Health, Safety, Environment and Quality Management training and consultancy across Africa.',
        longDescription: 'Frontrunner in Occupational Health, Safety, Environment and Quality Management — offering 22 HSE courses and consultancy to achieve and maintain ISO certification.',
        bulletGroups: [
            { subheading: 'ISO Management Systems', items: ['ISO 9001:2015 — Quality Management System (QMS)', 'ISO 14001:2015 — Environmental Management (EMS)', 'ISO 45001:2018 — Occupational Health & Safety (OSH-MS)', 'ISO 22000:2018 — Food Safety Management (FSM)'] },
            { subheading: 'Sample HSE Courses (22 Total)', items: ['Process Safety, First Aid, Fire Safety', 'Working at Height, Confined Space Entry', 'Defensive Driving, Risk Assessment', 'Permit to Work, Incident Investigation'] }
        ]
    },
    {
        slug: 'personnel', order: 4, icon: 'support_agent', title: 'Personnel Support Services',
        shortDescription: 'Comprehensive, personalized support for individuals in challenging offshore and onshore environments — one dedicated point of contact.',
        longDescription: 'Comprehensive, end-to-end personal support for individuals operating in challenging onshore and offshore environments across Equatorial Guinea.',
        bulletGroups: [
            { subheading: 'Travel & Logistics', items: ['Flight and hotel/lodging arrangements', 'Meet and greet at ports of entry', 'Local transport, transfer & vehicle rentals', 'Crew change management'] },
            { subheading: 'Immigration & Security', items: ['Visa and work permit processing', 'Letter of Invitation (LOI) services', 'Security services'] }
        ]
    },
    {
        slug: 'supply', order: 5, icon: 'warehouse', title: 'General Supply Services',
        shortDescription: 'Practically anything your workforce needs for on/offshore operations — sourced and delivered efficiently at reasonable prices.',
        longDescription: 'Practically anything your onshore or offshore workforce needs — sourced efficiently and delivered at competitive prices, keeping your operations running without interruption.',
        bulletGroups: [{ subheading: 'Items Supplied', items: ['Personal Protective Equipment (PPE)', 'Office supplies & consumables', 'Cleaning supplies & hand tools', 'Drinking water supply', 'Car parts & vehicle accessories', 'General industrial equipment'] }]
    },
    {
        slug: 'ndt', order: 6, icon: 'biotech', title: 'NDT & Inspection Services',
        shortDescription: 'Non-destructive testing, rope-access inspection and full lifting equipment certification compliant with international LEEA standards.',
        longDescription: 'IRATA-certified rope-access inspection, Non-Destructive Testing and full lifting equipment certification — delivered by LEEA member engineers to international standards.',
        bulletGroups: [
            { subheading: 'Techniques & Memberships', items: ['Rope-Access Technique (IRATA Operator)', 'Non-Destructive Testing (NDT)', 'Lifting Equipment Certifications (LEEA member)'] },
            { subheading: 'Equipment Inspected', items: ['Personnel & cargo elevators', 'Offshore cranes (all types)', 'Lifting gear, accessories & rigging lofts', 'Winches, hoists & lifting appliances', 'Life-saving equipment attachments & beams'] }
        ]
    },
    {
        slug: 'catalyst', order: 7, icon: 'science', title: 'Catalyst Handling & Mechanical Services',
        shortDescription: 'In partnership with HPA, BerCom delivers advanced catalyst handling for CPP owners and FPSO operators worldwide — highly trained personnel with offshore-compliant equipment.',
        longDescription: 'In partnership with HPA, BerCom Services delivers advanced offshore catalyst handling for CPP owners and FPSO operators worldwide — highly trained personnel with equipment designed specifically for offshore safety compliance.',
        bulletGroups: [{ subheading: 'Key Capabilities', items: ['Dense Loading — HYDROPAC® System (±3% density accuracy)', 'Reformer Loading — UNIPAC (3–10" tubes)', 'Reactor Internal Retrofits (30+ years HPA experience)', 'Ammonia converters, Parex, Platforming, CCR units'] }]
    }
];

const isoStandards = [
    { code: 'ISO 9001:2015', sublabel: 'Quality Management System', icon: 'workspace_premium', order: 0 },
    { code: 'ISO 45001:2018', sublabel: 'Occupational Health & Safety', icon: 'workspace_premium', order: 1 },
    { code: 'ISO 14001:2015', sublabel: 'Environmental Management', icon: 'workspace_premium', order: 2 },
    { code: 'ISO 22000:2018', sublabel: 'Food Safety Management', icon: 'workspace_premium', order: 3 },
    { code: 'ISO 27001:2013', sublabel: 'Information Security', icon: 'workspace_premium', order: 4 }
];

const clients = [
    { name: 'Baker Hughes', icon: 'business', tagline: 'Goods & Material Supply', dateBadge: 'July 2025 — Ongoing', engagementPeriod: 'July 2025 — Ongoing', scopeOfWork: 'Various Goods & Material Supply', order: 0 },
    { name: 'Altus Intervention', icon: 'precision_manufacturing', tagline: 'Personnel & Coil Tubing Ops', dateBadge: '2019 — Ongoing', engagementPeriod: 'September 2019 — Ongoing', scopeOfWork: 'Provision of On/Offshore Personnel & Coil Tubing Operations', order: 1 },
    { name: 'AMPCO', icon: 'factory', tagline: 'Supply, Inspection & Commissioning', dateBadge: '2021 — 2025', engagementPeriod: 'January 2023 — March 2025', scopeOfWork: 'Various Goods & Material Supply, Inspection & Commissioning', order: 2 },
    { name: 'Black Iron Energy', icon: 'local_gas_station', tagline: 'Offshore Tank Cleaning', dateBadge: '2022 — 2023', engagementPeriod: 'December 2022 — June 2023', scopeOfWork: 'Offshore Tank Cleaning Services', order: 3 }
];

const teamMembers = [
    { name: 'Emilio Nguema Obiang', role: 'Managing Director', photo: '/img/team-1.jpg', bio: "15+ years steering oil & gas operations across Equatorial Guinea, shaping BerCom's strategic vision and client partnerships from day one.", order: 0 },
    { name: 'Carlos Mba Esono', role: 'Head of Operations', photo: '/img/team-2.jpg', bio: "Veteran offshore vessel and logistics manager who coordinates BerCom's daily operational output, ensuring timely delivery across all active contracts.", order: 1 },
    { name: 'Ana Ela Nchama', role: 'QHSE Manager', photo: '/img/team-3.jpg', bio: "ISO lead auditor and HSE training specialist responsible for maintaining BerCom's full compliance with ISO 9001, 45001 and 14001 standards.", order: 2 },
    { name: 'Rodrigo Ondo Abaga', role: 'Business Development Manager', photo: '/img/team-4.jpg', bio: 'Drives client relations, procurement and commercial growth — cultivating long-term partnerships with multinational operators across Africa.', order: 3 }
];

const testimonials = [
    { quoteText: "BerCom Services has been our go-to partner for on/offshore personnel in Equatorial Guinea since 2019. Their team's deep understanding of local immigration requirements and logistics has saved us countless hours. The personnel they supply meet our technical standards every time — truly reliable.", authorName: 'Jean-Paul Obiang Mba', authorRole: 'Operations Manager, Altus Intervention', avatarInitials: 'JO', serviceIcon: 'support_agent', serviceLabel: 'Personnel Supply & Coil Tubing Ops', order: 0 },
    { quoteText: 'We engaged BerCom for urgent material procurement in mid-2025 and were impressed by their responsiveness and sourcing capability. Items were delivered on time, correctly documented, and without any supply-chain complications. A dependable local partner.', authorName: 'Carlos Ekong', authorRole: 'Procurement Lead, Baker Hughes (EG)', avatarInitials: 'CE', serviceIcon: 'warehouse', serviceLabel: 'Goods & Material Supply', order: 1 },
    { quoteText: 'BerCom carried out the inspection and certification of our 150T Mobile Grove Crane in 2021 to LEEA standards. The team was professional, thorough and the documentation was impeccable. We have continued to use them for our annual lifting equipment inspections.', authorName: 'Miriam Ondo Nchama', authorRole: 'HSSEQ Coordinator, AMPCO', avatarInitials: 'MO', serviceIcon: 'biotech', serviceLabel: 'Crane Inspection & Lifting Gear Certification', order: 2 },
    { quoteText: 'The offshore tank cleaning scope BerCom executed for us in 2022–2023 was completed safely and on schedule. Their QHSE protocols on-site were impressive, and their crew demonstrated excellent competency. We would not hesitate to work with them again.', authorName: 'David Ashworth', authorRole: 'Project Manager, Black Iron Energy', avatarInitials: 'DA', serviceIcon: 'directions_boat', serviceLabel: 'Offshore Tank Cleaning', order: 3 },
    { quoteText: "We enrolled our team in BerCom's ISO 45001 Lead Auditor course and the quality of training exceeded our expectations. The instructors are practising professionals — not academics — which made the content immediately applicable to our operations. Highly recommended.", authorName: 'Sophie Engonga', authorRole: 'HSE Manager, Regional Operator', avatarInitials: 'SE', serviceIcon: 'health_and_safety', serviceLabel: 'QHSE Training & ISO Consultancy', order: 4 },
    { quoteText: 'BerCom handles our vessel provisioning and crew logistics in Malabo. Their ship chandelling service is reliable, their pricing is transparent, and their team is always reachable — day or night. One point of contact for provisioning, immigration and transport — a real efficiency gain.', authorName: 'Antoine Mbarga', authorRole: 'Logistics Coordinator, International Energy Co.', avatarInitials: 'AM', serviceIcon: 'inventory_2', serviceLabel: 'Ship Chandelling & Personnel Support', order: 5 }
];

function isoCourse(slug, variant, code, icon, order) {
    const lead = variant === 'lead';
    const descriptions = {
        'iso-9001': 'Quality Management System — Lead Auditor & Internal Auditor certification. Understand, implement and audit QMS to international standard.',
        'iso-45001': 'Occupational Health & Safety — Lead Auditor & Internal Auditor certification. Plan, implement and evaluate OHS management systems.',
        'iso-14001': "Environmental Management — Lead Auditor & Internal Auditor certification. Identify, manage and reduce your organisation's environmental impact.",
        'iso-22000': 'Food Safety Management — Lead Auditor & Internal Auditor certification. Implement and audit FSMS across the food supply chain.'
    };
    return {
        slug: `${slug}${lead ? '' : '-ia'}`, order, category: 'iso-lead-auditor',
        title: `${code} ${lead ? '(Lead Auditor)' : '(Internal Auditor)'}`,
        description: descriptions[slug], gradientKey: slug, icon,
        durationLabel: lead ? '5 Days' : '3 Days',
        bullets: [`${lead ? 'Lead' : 'Internal'} Auditor: ${lead ? '5' : '3'} days`, 'Certificate of completion', 'In-house or open enrolment'],
        priceLabel: 'Pricing', priceValue: 'Contact Us'
    };
}

const courses = [
    isoCourse('iso-9001', 'lead', 'ISO 9001:2015', 'workspace_premium', 0),
    isoCourse('iso-9001', 'internal', 'ISO 9001:2015', 'workspace_premium', 1),
    isoCourse('iso-45001', 'lead', 'ISO 45001:2018', 'health_and_safety', 2),
    isoCourse('iso-45001', 'internal', 'ISO 45001:2018', 'health_and_safety', 3),
    isoCourse('iso-14001', 'lead', 'ISO 14001:2015', 'eco', 4),
    isoCourse('iso-14001', 'internal', 'ISO 14001:2015', 'eco', 5),
    isoCourse('iso-22000', 'lead', 'ISO 22000:2018', 'restaurant', 6),
    isoCourse('iso-22000', 'internal', 'ISO 22000:2018', 'restaurant', 7),

    { slug: 'psm', order: 8, category: 'hse-safety', title: 'Process Safety Management', description: 'Systematic framework to manage hazards associated with highly hazardous chemicals. Covers OSHA PSM elements and PHA techniques.', gradientKey: 'psm', icon: 'warning_amber', durationLabel: '3 Days', bullets: ['Duration: 3 days', 'Certificate of completion', 'In-house or open enrolment'], priceLabel: 'Pricing', priceValue: 'Contact Us' },
    { slug: 'firstaid', order: 9, category: 'hse-safety', title: 'First Aid & Emergency Response', description: 'Practical emergency first aid, CPR & AED. OPITO-aligned. Required for all offshore personnel.', gradientKey: 'firstaid', icon: 'medical_services', durationLabel: '2 Days', bullets: ['Duration: 2 days', 'Certificate of completion', 'In-house or open enrolment'], priceLabel: 'Pricing', priceValue: 'Contact Us' },
    { slug: 'fire', order: 10, category: 'hse-safety', title: 'Fire Safety & Prevention', description: 'Fire hazard identification, prevention strategies, extinguisher use and emergency evacuation procedures.', gradientKey: 'fire', icon: 'local_fire_department', durationLabel: '1 Day', bullets: ['Duration: 1 day', 'Certificate of completion', 'In-house or open enrolment'], priceLabel: 'Pricing', priceValue: 'Contact Us' },
    { slug: 'height', order: 11, category: 'hse-safety', title: 'Working at Height', description: 'Safe systems of work at height. Covers harness inspection, anchor points, rescue and fall prevention planning.', gradientKey: 'height', icon: 'construction', durationLabel: '2 Days', bullets: ['Duration: 2 days', 'Certificate of completion', 'In-house or open enrolment'], priceLabel: 'Pricing', priceValue: 'Contact Us' },
    { slug: 'confined', order: 12, category: 'hse-safety', title: 'Confined Space Entry', description: 'Risk assessment, atmospheric monitoring, permit-to-enter, emergency rescue for confined space operations.', gradientKey: 'confined', icon: 'sensor_door', durationLabel: '2 Days', bullets: ['Duration: 2 days', 'Certificate of completion', 'In-house or open enrolment'], priceLabel: 'Pricing', priceValue: 'Contact Us' },
    { slug: 'risk', order: 13, category: 'hse-safety', title: 'Risk Assessment & Management', description: 'Systematic hazard identification, risk evaluation and control measures. Aligned with ISO 45001 requirements.', gradientKey: 'risk', icon: 'manage_search', durationLabel: '2 Days', bullets: ['Duration: 2 days', 'Certificate of completion', 'In-house or open enrolment'], priceLabel: 'Pricing', priceValue: 'Contact Us' },
    { slug: 'ptw', order: 14, category: 'hse-safety', title: 'Permit to Work (PTW)', description: 'PTW system design, implementation and audit. Hot work, cold work, confined space and electrical isolation permits.', gradientKey: 'ptw', icon: 'assignment_turned_in', durationLabel: '1 Day', bullets: ['Duration: 1 day', 'Certificate of completion', 'In-house or open enrolment'], priceLabel: 'Pricing', priceValue: 'Contact Us' },
    { slug: 'incident', order: 15, category: 'hse-safety', title: 'Incident Investigation', description: 'Root cause analysis, fault tree analysis and bow-tie methodology. Reporting, learning and corrective action.', gradientKey: 'incident', icon: 'policy', durationLabel: '2 Days', bullets: ['Duration: 2 days', 'Certificate of completion', 'In-house or open enrolment'], priceLabel: 'Pricing', priceValue: 'Contact Us' },

    { slug: 'welding', order: 16, category: 'hse-safety', title: 'Welding Safety', description: 'Safe welding practices, hot work precautions and fire watch procedures for oil & gas and construction environments.', gradientKey: 'psm', icon: 'whatshot', durationLabel: '1 Day', bullets: ['Duration: 1 day', 'Certificate of completion', 'In-house or open enrolment'], priceLabel: 'Pricing', priceValue: 'Contact Us' },
    { slug: 'manual', order: 17, category: 'hse-safety', title: 'Manual Handling', description: 'Correct lifting, carrying and manual handling techniques to prevent musculoskeletal injury in industrial workplaces.', gradientKey: 'firstaid', icon: 'fitness_center', durationLabel: '1 Day', bullets: ['Duration: 1 day', 'Certificate of completion', 'In-house or open enrolment'], priceLabel: 'Pricing', priceValue: 'Contact Us' },
    { slug: 'scaffold', order: 18, category: 'hse-safety', title: 'Scaffold Safety', description: 'Safe erection, inspection and use of scaffolding — covers tagging systems and working-at-height interfaces.', gradientKey: 'height', icon: 'foundation', durationLabel: '1 Day', bullets: ['Duration: 1 day', 'Certificate of completion', 'In-house or open enrolment'], priceLabel: 'Pricing', priceValue: 'Contact Us' },
    { slug: 'defensive', order: 19, category: 'hse-safety', title: 'Defensive Driving', description: 'Defensive driving techniques for local and offshore-access roads, reducing incident risk for company drivers.', gradientKey: 'risk', icon: 'drive_eta', durationLabel: '1 Day', bullets: ['Duration: 1 day', 'Certificate of completion', 'In-house or open enrolment'], priceLabel: 'Pricing', priceValue: 'Contact Us' },
    { slug: 'hse-induction', order: 20, category: 'hse-safety', title: 'HSE Induction', description: 'Mandatory site HSE induction covering hazard awareness, emergency procedures and reporting requirements.', gradientKey: 'fire', icon: 'how_to_reg', durationLabel: 'Half Day', bullets: ['Duration: half day', 'Certificate of completion', 'In-house or open enrolment'], priceLabel: 'Pricing', priceValue: 'Contact Us' },
    { slug: 'supervisor', order: 21, category: 'hse-safety', title: 'Safety for Supervisors', description: 'Safety leadership and toolbox-talk skills for frontline supervisors responsible for crew safety compliance.', gradientKey: 'confined', icon: 'supervisor_account', durationLabel: '2 Days', bullets: ['Duration: 2 days', 'Certificate of completion', 'In-house or open enrolment'], priceLabel: 'Pricing', priceValue: 'Contact Us' },
    { slug: 'gas-test', order: 22, category: 'hse-safety', title: 'Gas Testing & Detection', description: 'Atmospheric gas testing and detection equipment use for confined space and hazardous area entry.', gradientKey: 'ptw', icon: 'sensors', durationLabel: '1 Day', bullets: ['Duration: 1 day', 'Certificate of completion', 'In-house or open enrolment'], priceLabel: 'Pricing', priceValue: 'Contact Us' },
    { slug: 'dangerous-goods', order: 23, category: 'hse-safety', title: 'Dangerous Goods Handling', description: 'Classification, handling, storage and transport requirements for dangerous goods in industrial operations.', gradientKey: 'incident', icon: 'dangerous', durationLabel: '1 Day', bullets: ['Duration: 1 day', 'Certificate of completion', 'In-house or open enrolment'], priceLabel: 'Pricing', priceValue: 'Contact Us' },
    { slug: 'hazardous', order: 24, category: 'hse-safety', title: 'Hazardous Area Operations', description: 'Safe systems of work for operations in classified hazardous (explosive atmosphere) areas.', gradientKey: 'psm', icon: 'warning', durationLabel: '2 Days', bullets: ['Duration: 2 days', 'Certificate of completion', 'In-house or open enrolment'], priceLabel: 'Pricing', priceValue: 'Contact Us' }
];

const siteSettingsData = {
    companyName: 'BerCom', companySub: 'Services',
    tagline: 'Indigenous Oil & Gas Services — Malabo, Equatorial Guinea',
    foundingYear: 2018,
    address: 'Edificio Davinchi Malabo II, Malabo, Equatorial Guinea',
    mapQuery: 'Malabo Equatorial Guinea',
    email: 'contactus@bercomservices.com',
    phone: '+240 222 196 144',
    website: 'www.bercomserviceintegrations.com',
    socialLinks: { linkedin: '', facebook: '', twitter: '' },
    pageHeroBackgroundImage: '/img/banner-img.jpg',
    nav: [
        { label: 'Home', targetSlug: 'home' },
        { label: 'About', targetSlug: 'about' },
        { label: 'Services', targetSlug: 'services' },
        { label: 'Courses', targetSlug: 'courses' },
        { label: 'Team', targetSlug: 'team' },
        { label: 'Testimonials', targetSlug: 'testimonials' },
        { label: 'References', targetSlug: 'home', anchorId: 'references' },
        { label: 'Contact', targetSlug: 'contact' }
    ],
    footer: {
        blurb: 'Indigenous oil & gas services company headquartered in Malabo, Equatorial Guinea. Delivering world-class offshore support, QHSE training and logistics since 2018.',
        quickLinks: [
            { label: 'Home', href: '/' }, { label: 'About Us', href: '/about' }, { label: 'Services', href: '/services' },
            { label: 'Courses', href: '/courses' }, { label: 'Team', href: '/team' }, { label: 'Testimonials', href: '/testimonials' },
            { label: 'References', href: '/#references' }, { label: 'Contact', href: '/contact' }
        ],
        copyrightText: '© 2024 BerCom Services. All rights reserved.',
        developerCredit: 'Malabo, Equatorial Guinea &nbsp;|&nbsp; Developed by <a href="https://pmdzorkpe.vercel.app/" target="_blank" rel="noopener noreferrer" class="text-primary text-decoration-none">Kobby_Prime</a>'
    },
    research: {
        queries: [
            'Equatorial Guinea oil gas', 'Malabo offshore project', 'Equatorial Guinea LNG',
            'Punta Europa refinery', 'Equatorial Guinea drilling contract', 'Equatorial Guinea energy investment', 'Bioko oil gas'
        ],
        autoRunEnabled: true, cronSchedule: '0 6 * * *', confidenceThreshold: 0.55
    }
};

// ---- Page section content (uses the exact copy from the original static pages) ----

const homeSections = [
    {
        kind: 'HeroCarousel', order: 0, visible: true, data: {
            slides: [
                { badge: 'Est. 2018 — Malabo, Equatorial Guinea', title: 'Driving Excellence in Oil & Gas Services', subtitle: 'Indigenous company delivering world-class offshore support, logistics, QHSE training and supply services to multinational operators across Africa.', bgImageClass: 'bc-hero-slide-1', ctaPrimary: { label: 'Our Services', href: '/services' }, ctaSecondary: { label: 'Learn More', href: '/about' } },
                { badge: 'Offshore Operations', title: 'Advanced Offshore Support & Vessel Operations', subtitle: 'Fleet of AHTS, PSV, CSV, FSIV and DSV vessels — immediate responsiveness and efficient logistics for your most demanding offshore requirements.', bgImageClass: 'bc-hero-slide-2', ctaPrimary: { label: 'Explore Fleet', href: '/services#offshore' }, ctaSecondary: { label: 'Contact Us', href: '/contact' } },
                { badge: 'QHSE Excellence', title: 'Safety. Quality. Environmental Responsibility.', subtitle: 'Frontrunner in QHSE training, consultancy and ISO certification — ISO 9001 · ISO 45001 · ISO 14001 compliant for your organization.', bgImageClass: 'bc-hero-slide-3', ctaPrimary: { label: 'QHSE Programs', href: '/services#qhse' }, ctaSecondary: { label: 'Get Certified', href: '/contact' } }
            ]
        }
    },
    { kind: 'StatsStrip', order: 1, visible: true, data: { variant: 'strip', items: [{ value: '2018', label: 'Year Founded' }, { value: '7+', label: 'Core Services' }, { value: '4+', label: 'Major Clients' }, { value: '4', label: 'ISO Standards' }] } },
    {
        kind: 'TextWithImage', order: 2, visible: true, anchorId: 'about', data: {
            label: 'About BerCom Services', title: 'Your Indigenous Partner in Oil & Gas Excellence', sectionBg: 'bc-section-light',
            paragraphs: [
                'Founded in 2018, BerCom Services is an indigenous company headquartered in Malabo, Equatorial Guinea, providing integrated general services to multinational companies across the oil & gas, energy and construction sectors.',
                'Our management team brings extensive experience from the safety sector of the oil & gas industry — enabling BerCom to deliver expertise, quality and immediate responsiveness for efficient logistics and service delivery.'
            ],
            image: { main: '/img/about-1.jpg', thumb: '/img/about-2.jpg', badgeYear: '2018', badgeCaption: 'Established in<br>Malabo, E.G.' },
            featureCards: [
                { icon: 'verified', title: 'QHSE Compliant', text: 'Full QHSE standards adherence' },
                { icon: 'public', title: 'Indigenous Expertise', text: 'Local knowledge, global standards' },
                { icon: 'speed', title: 'Immediate Response', text: '24/7 operational readiness' },
                { icon: 'handshake', title: 'Client Partnership', text: 'Collaborative, transparent, trusted' }
            ],
            missionVisionBox: { items: [
                { label: 'Mission', text: 'To deliver exemplary transhipment operations, procurement and charter services — on time, on budget — according to global safety and quality standards.' },
                { label: 'Vision', text: "To provide high quality international logistics solutions, profitable and tailored to our clients' needs, built on transparency, respect and lasting partnership." }
            ] },
            cta: { label: 'Work With Us', href: '/contact' }
        }
    },
    {
        kind: 'ServiceCardGrid', order: 3, visible: true, anchorId: 'services', data: {
            label: 'What We Do', title: 'Comprehensive Oil & Gas Services', sectionBg: 'bc-section-white', variant: 'summary',
            intro: 'BerCom Services offers a full suite of integrated services designed to meet the diverse operational needs of multinational companies in the oil, gas and energy sectors.',
            wideCta: { title: 'Need a Customised Solution?', text: "We work closely with clients to achieve optimum efficiency and profitability. Let's discuss your requirements.", button: { label: 'Contact Us', href: '/contact' } }
        }
    },
    {
        kind: 'FeatureBlocksWithStats', order: 4, visible: true, anchorId: 'catalyst', data: {
            label: 'Specialised Service', title: 'Catalyst Handling & Mechanical Services', theme: 'dark',
            intro: 'In partnership with HPA, BerCom Services delivers advanced offshore catalyst handling for CPP owners and FSPO operators worldwide — highly trained personnel with equipment designed specifically for offshore safety compliance.',
            featureBlocks: [
                { icon: '', title: 'Dense Loading — HYDROPAC®', text: 'Maximum catalyst loading with uniform flow distribution. Our proprietary HYDROPAC system achieves optimal density within ±3% of theoretical maximum. Tighter packing, longer runs, better reactant flow — proven world leader in dense loading.', bullets: [] },
                { icon: '', title: 'Reformer Loading — UNIPAC', text: 'Fast, high-quality tube loading for 3–10" internal diameter reformer tubes. No pre-sacking, no vibration required. Substantially reduces loading time while eliminating hot spots, reducing settling and prolonging tube life.', bullets: [] },
                { icon: '', title: 'Reactor Internal Retrofits', text: '30+ years of HPA expertise in complex reactor maintenance — ammonia converters, Parex units, Platforming reactors and CCR units. Tailor-made solutions for distribution trays, thermocouples and quench sections.', bullets: [] }
            ],
            statTiles: [
                { icon: 'science', value: '±3%', label: 'Loading density accuracy' },
                { icon: 'timer', value: 'Faster', label: 'Reformer loading time' },
                { icon: 'shield', value: 'SAFE', label: 'Offshore compliance' },
                { icon: 'engineering', value: '30+', label: 'Years HPA expertise' }
            ],
            keyAdvantages: { title: 'HYDROPAC® Key Advantages', items: ['Uniform catalyst packing for better reactant flow', 'Beds do not sag or change flow patterns during run', 'Reversible rotation for loading around transfer tubes', 'Loads higher — positioned 6" below distributor tray', 'No centre-shaft obstruction for maximum bed uniformity'] },
            cta: { label: 'Request This Service', href: '/contact' }
        }
    },
    {
        kind: 'IsoCardGrid', order: 5, visible: true, anchorId: 'qhse', data: {
            label: 'Safety & Compliance', title: 'QHSE Excellence & Certification', sectionBg: 'bc-section-light', layout: 'grid',
            intro: 'BerCom is a frontrunner in Occupational Health & Safety, Environmental and Quality Management training and consultancy. We help companies across all industries in Africa achieve ISO certification and maintain world-class safety standards.'
        }
    },
    {
        kind: 'TagChipList', order: 6, visible: true, data: {
            heading: 'Available HSE Training Courses',
            chips: ['Process Safety Management', 'Welding Safety', 'First Aid', 'Fire Safety', 'Manual Handling', 'Confined Space Entry', 'Working at Height', 'Scaffold Safety', 'COSHH Assessments', 'Defensive Driving', 'HSE Induction', 'Safety for Supervisors', 'Gas Testing', 'Incident Investigation', 'Risk Assessment', 'Permit to Work', 'Construction Safety', 'Hazardous Area', 'Process Safety (PHA)', 'Dangerous Goods', 'ISO Lead Auditor']
        }
    },
    {
        kind: 'ClientCardGrid', order: 7, visible: true, anchorId: 'references', data: {
            label: 'Track Record', title: 'Our Clients & References', sectionBg: 'bc-section-white', variant: 'cardsWithBadge',
            intro: 'Trusted by some of the most respected operators in the oil & gas industry across Equatorial Guinea and Africa.'
        }
    },
    {
        kind: 'ContactSection', order: 8, visible: true, anchorId: 'contact', data: {
            label: 'Get In Touch', title: 'Contact BerCom Services',
            intro: 'Ready to discuss your requirements? Our team is available to provide tailored solutions for your operations.',
            showMiniCards: false, showDetailsCard: true, showForm: true, showBusinessHours: false, showMapPlaceholder: false,
            submitLabel: 'Send Message',
            formFields: [
                { name: 'fullName', label: 'Full Name', type: 'text', required: false, half: true, placeholder: 'Your full name' },
                { name: 'company', label: 'Company', type: 'text', required: false, half: true, placeholder: 'Your company name' },
                { name: 'email', label: 'Email Address', type: 'email', required: false, half: true, placeholder: 'your@email.com' },
                { name: 'service', label: 'Service Interest', type: 'select', required: false, half: true, options: [
                    { value: 'offshore', label: 'Offshore Support Vessels' }, { value: 'chandelling', label: 'Ship Chandelling' },
                    { value: 'manpower', label: 'Manpower Supply' }, { value: 'qhse', label: 'QHSE Training & Consultancy' },
                    { value: 'personnel', label: 'Personnel Support Services' }, { value: 'supply', label: 'General Supply Services' },
                    { value: 'ndt', label: 'NDT & Inspection' }, { value: 'catalyst', label: 'Catalyst Handling & Mechanical' }
                ] },
                { name: 'message', label: 'Message', type: 'textarea', required: false, half: false, placeholder: 'Describe your requirements...' }
            ]
        }
    }
];

const aboutSections = [
    {
        kind: 'TextWithImage', order: 0, visible: true, data: {
            label: 'Our Story', title: 'Your Indigenous Partner in Oil & Gas Excellence', sectionBg: 'bc-section-light',
            paragraphs: [
                'Founded in 2018 and headquartered at Edificio Davinchi Malabo II in Malabo, Equatorial Guinea, BerCom Services is an indigenous company providing integrated general services to multinational companies across the oil & gas, energy and construction sectors.',
                'Our management team brings deep expertise from the safety sector of the international oil & gas industry — enabling BerCom to deliver quality, precision and immediate responsiveness for your most demanding logistics and operational requirements.',
                'Guided by a culture of transparency, respect and trust, we work in close partnership with our clients — from multinational operators to regional contractors — to achieve optimum efficiency, safety and profitability on every engagement.'
            ],
            image: { main: '/img/about-1.jpg', badgeYear: '2018', badgeCaption: 'Established in<br>Malabo, E.G.' },
            featureCards: [
                { icon: 'verified', title: 'QHSE Compliant', text: 'Full adherence to global safety & quality standards' },
                { icon: 'public', title: 'Indigenous Expertise', text: 'Local knowledge backed by global standards' },
                { icon: 'speed', title: 'Immediate Response', text: '24/7 operational readiness & efficient delivery' },
                { icon: 'handshake', title: 'Client Partnership', text: 'Collaborative, transparent and lasting relationships' }
            ],
            cta: { label: 'Work With Us', href: '/contact' }
        }
    },
    {
        kind: 'FeatureCardGrid', order: 1, visible: true, data: {
            label: 'What Drives Us', title: 'Mission & Vision', columns: 2, sectionBg: 'bc-section-white',
            intro: 'Every project we undertake is shaped by a clear set of guiding commitments — to our clients, our people and the communities we serve.',
            cards: [
                { icon: 'flag', title: 'Our Mission', text: 'To deliver exemplary transhipment operations, procurement and charter services — on time, on budget — according to global safety and quality standards. We are committed to operational excellence at every stage, ensuring our clients receive nothing less than the highest level of service.' },
                { icon: 'visibility', title: 'Our Vision', text: "To provide high quality international logistics solutions — profitable and tailored to our clients' needs — built on a foundation of transparency, exchange, respect and trust. We aim to be the preferred indigenous partner for oil & gas operators across Equatorial Guinea and the wider African continent." }
            ]
        }
    },
    {
        kind: 'FeatureCardGrid', order: 2, visible: true, data: {
            label: 'Our Principles', title: 'Core Values', columns: 3, sectionBg: 'bc-section-light',
            intro: 'These six principles guide every decision, every project and every relationship at BerCom Services.',
            cards: [
                { icon: 'health_and_safety', title: 'Safety First', text: 'The safety of our people, our clients and the environment is non-negotiable. We embed QHSE standards into every operation and every decision we make.' },
                { icon: 'workspace_premium', title: 'Excellence', text: 'We hold ourselves to the highest standards in everything we do — delivering quality outcomes on time and on budget, without compromise.' },
                { icon: 'gavel', title: 'Integrity', text: 'We operate with transparency and honesty in all our dealings — building trust that stands the test of time with clients, partners and regulators alike.' },
                { icon: 'lightbulb', title: 'Innovation', text: 'We continuously seek smarter, more efficient ways to serve our clients — embracing new technologies and best practices to stay ahead of industry demands.' },
                { icon: 'handshake', title: 'Client Partnership', text: 'Our clients are partners, not just contracts. We invest in understanding your business and align our resources to help you achieve your strategic goals.' },
                { icon: 'public', title: 'Local Expertise', text: 'As an indigenous company rooted in Equatorial Guinea, we bring irreplaceable local knowledge combined with international standards to every engagement.' }
            ]
        }
    },
    { kind: 'IsoCardGrid', order: 3, visible: true, data: { label: 'Quality Assurance', title: 'ISO Certifications & Standards', sectionBg: 'bc-section-white', layout: 'row', intro: 'BerCom Services is a certified frontrunner in Quality, Health, Safety, Environmental and Food Safety management — verified by internationally recognised ISO standards.' } },
    { kind: 'ClientCardGrid', order: 4, visible: true, data: { label: 'Track Record', title: 'Clients Who Trust BerCom', sectionBg: 'bc-section-light', variant: 'cards', intro: 'Trusted by leading operators in the oil & gas industry across Equatorial Guinea and Africa.' } },
    { kind: 'CtaBanner', order: 5, visible: true, data: { label: "Let's Collaborate", title: 'Ready to Partner With Us?', theme: 'dark', text: "Whether you need offshore logistics, QHSE expertise, manpower or supply services — our team is ready to tailor a solution to your exact requirements. Let's talk.", buttons: [{ label: 'Contact Us', href: '/contact', icon: 'mail' }, { label: 'Explore Services', href: '/services' }] } }
];

const servicesSections = [
    {
        kind: 'ServiceCardGrid', order: 0, visible: true, anchorId: 'services-overview', data: {
            label: 'Integrated Solutions', title: 'Comprehensive Oil & Gas Services', sectionBg: 'bc-section-light', variant: 'full',
            intro: 'BerCom Services delivers a full suite of integrated services designed to meet the diverse operational needs of multinational companies in the oil, gas and energy sectors — onshore and offshore.'
        }
    },
    {
        kind: 'FeatureBlocksWithStats', order: 1, visible: true, anchorId: 'catalyst', data: {
            label: 'Specialised Service — HPA Partnership', title: 'Catalyst Handling & Mechanical Services', theme: 'dark',
            intro: 'In partnership with HPA, BerCom Services delivers world-class catalyst handling for CPP owners and FPSO operators — highly trained personnel, specialised offshore-compliant equipment, and 30+ years of proven expertise.',
            featureBlocks: [
                { icon: 'compress', title: 'Dense Loading — HYDROPAC®', text: 'Maximum catalyst loading with uniform flow distribution. The proprietary HYDROPAC® system achieves optimal density — the world leader in dense loading technology.', bullets: ['±3% density accuracy vs. theoretical maximum', 'Reversible rotation — loads around transfer tubes', 'Positioned 6" below distributor tray — loads higher', 'No centre-shaft obstruction for full bed uniformity', 'Beds do not sag or alter flow during the run'] },
                { icon: 'tune', title: 'Reformer Loading — UNIPAC', text: 'Fast, high-quality tube loading for reformers. Substantially reduces loading time while eliminating hot spots, reducing settling and prolonging tube life.', bullets: ['Accommodates 3–10" internal diameter tubes', 'No pre-sacking required', 'No vibration required during loading', 'Eliminates hot spots for longer tube life', 'Significantly faster than conventional methods'] },
                { icon: 'engineering', title: 'Reactor Internal Retrofits', text: '30+ years of HPA expertise in complex reactor maintenance — tailor-made solutions for the most demanding reactor units across multiple process technologies.', bullets: ['Ammonia converters', 'Parex unit internals', 'Platforming reactors', 'CCR (Continuous Catalyst Regeneration) units', 'Distribution trays, thermocouples & quench sections'] }
            ],
            statTiles: [
                { icon: 'science', value: '±3%', label: 'Loading density accuracy' },
                { icon: 'timer', value: 'Faster', label: 'Reformer loading time' },
                { icon: 'shield', value: 'SAFE', label: 'Offshore compliance' },
                { icon: 'workspace_premium', value: '30+', label: 'Years HPA expertise' }
            ],
            cta: { label: 'Request This Service', href: '/contact' }
        }
    },
    {
        kind: 'FeatureCardGrid', order: 2, visible: true, anchorId: 'why-bercom', data: {
            label: 'Our Strengths', title: 'Why Choose BerCom Services?', columns: 4, sectionBg: 'bc-section-white',
            intro: 'Founded in 2018 and headquartered in Malabo, BerCom combines indigenous local expertise with world-class operational standards to deliver measurable results for our clients.',
            cards: [
                { icon: 'verified', title: 'QHSE Certified', text: 'Adherent to ISO 9001, ISO 14001, ISO 45001 and ISO 22000 management systems — quality and safety at the core of every service delivered.' },
                { icon: 'public', title: 'Local Expertise', text: 'Indigenous company with deep roots in Equatorial Guinea — local knowledge, relationships and regulatory know-how combined with global service standards.' },
                { icon: 'compare_arrows', title: 'Full Coverage', text: 'Eight integrated service lines covering vessel operations, manpower, supply, inspection, training and logistics — a single partner for all your operational needs.' },
                { icon: 'speed', title: 'Immediate Response', text: '24/7 operational readiness with steadfast stock and delivery systems — coverage and immediate responsiveness for efficient logistics in time-critical environments.' }
            ]
        }
    },
    { kind: 'CtaBanner', order: 3, visible: true, data: { label: 'Work With Us', title: 'Ready to Discuss Your Requirements?', theme: 'light', text: 'Our management team brings extensive oil & gas experience and is ready to tailor a solution around your specific operational needs — onshore or offshore, locally or across Africa.', buttons: [{ label: 'Contact Us Today', href: '/contact', icon: 'mail' }] } }
];

const coursesSections = [
    {
        kind: 'FeatureCardGrid', order: 0, visible: true, data: {
            label: 'QHSE & Safety Training', title: 'Professional QHSE & Safety Training', columns: 3, sectionBg: 'bc-section-light',
            intro: 'BerCom is a frontrunner in Occupational Health, Safety, Environmental and Quality Management training across Africa. All courses are delivered by certified professionals with extensive oil & gas industry experience.',
            cards: [
                { icon: 'school', title: 'Expert Instructors', text: 'Certified trainers with hands-on oil & gas field experience across Africa and internationally.' },
                { icon: 'workspace_premium', title: 'Internationally Recognised', text: 'Curriculum aligned with ISO, OSHA and OPITO international standards and best practice frameworks.' },
                { icon: 'groups', title: 'Available In-House or Open', text: 'Choose open enrolment at our Malabo training centre or flexible in-house delivery at your site.' }
            ]
        }
    },
    { kind: 'CourseCardGrid', order: 1, visible: true, data: { label: 'ISO Certification', title: 'ISO Management System Courses', sectionBg: 'bc-section-white', category: 'iso-lead-auditor', enrollHref: '/courses#enroll', intro: 'Achieve internationally recognised ISO certification. Courses available as Lead Auditor (5 days) and Internal Auditor (3 days).' } },
    { kind: 'CourseCardGrid', order: 2, visible: true, data: { label: 'HSE Training', title: 'HSE Safety Training Courses', sectionBg: 'bc-section-light', category: 'hse-safety', enrollHref: '/courses#enroll', intro: 'Practical safety training for oil & gas, construction and industrial sectors. Delivered on-site or at our Malabo training centre.' } },
    { kind: 'EnrollmentForm', order: 3, visible: true, anchorId: 'enroll', data: { label: 'Register Today', title: 'Enrol in a Course', intro: 'Fill in the form below, select your course(s) of interest, and our training coordinator will contact you with scheduling, pricing and logistics.' } },
    {
        kind: 'FeatureCardGrid', order: 4, visible: true, data: {
            label: 'Our Advantage', title: 'Why Train With BerCom?', columns: 4, sectionBg: 'bc-section-white',
            intro: 'We combine international standards, industry experience and local knowledge to deliver training that makes a measurable difference in workplace safety and compliance.',
            cards: [
                { icon: 'verified_user', title: 'Certified Trainers', text: 'All instructors hold recognised international certifications and bring real-world oil & gas field experience to the classroom.' },
                { icon: 'menu_book', title: 'ISO Aligned Curriculum', text: 'Every course is designed in alignment with current ISO, OSHA and OPITO frameworks — keeping your team audit-ready at all times.' },
                { icon: 'precision_manufacturing', title: 'Oil & Gas Focused', text: 'Our training scenarios and case studies are drawn directly from offshore and onshore oil & gas operations across Africa and beyond.' },
                { icon: 'emoji_events', title: 'Certificate Issued', text: 'Every participant who completes a course receives a BerCom Services certificate of completion, recognised across the industry.' }
            ]
        }
    },
    { kind: 'CtaBanner', order: 5, visible: true, data: { label: 'Tailored Training', title: 'Have a Bespoke Training Need?', theme: 'light', text: "Tell us your team's requirements and we'll design a course to match — in-house, on-site or at our Malabo centre.", buttons: [{ label: 'Contact Us', href: '/contact', icon: 'mail' }] } }
];

const teamSections = [
    { kind: 'TeamGrid', order: 0, visible: true, data: { label: 'The People Behind BerCom', title: 'Leadership Forged in Oil & Gas', sectionBg: 'bc-section-white', intro: "Before BerCom Services was established in 2018, our management team had already accumulated deep, hands-on expertise within the safety sector of the oil & gas industry. That foundation — built across offshore installations, QHSE systems and operational logistics — is what powers every service we deliver today. Our people don't just understand the industry; they've lived it." } },
    {
        kind: 'FeatureCardGrid', order: 1, visible: true, data: {
            label: 'Our Strengths', title: 'Why Our Team Stands Out', columns: 3, sectionBg: 'bc-section-light',
            intro: "Three pillars define how BerCom's people show up for every client, every contract, every day.",
            cards: [
                { icon: 'engineering', title: 'Deep Industry Experience', text: 'Every member of our leadership team entered BerCom with years of active O&G field experience behind them — offshore, onshore, and in demanding logistical environments across West Africa. That real-world depth translates directly into faster problem-solving and fewer surprises for our clients.' },
                { icon: 'health_and_safety', title: 'QHSE-First Culture', text: 'Safety is not an afterthought at BerCom — it is the foundation our team was built on. Rooted in the safety sector of oil & gas before the company was even founded, our team embeds ISO-aligned QHSE principles into every operation, training programme and supply chain decision we make.' },
                { icon: 'handshake', title: 'Client-First Commitment', text: 'BerCom was built on the belief that lasting partnership matters more than any single contract. Our team maintains direct, transparent communication with every client — understanding your operational priorities and delivering tailored solutions that are on time, on budget and aligned with your goals.' }
            ]
        }
    },
    { kind: 'CtaBanner', order: 2, visible: true, data: { label: 'Ready to Collaborate?', title: 'Work With Our Expert Team', theme: 'dark', text: "Whether you need offshore vessel support, QHSE consultancy, skilled manpower or integrated logistics — our team is ready to deliver. Let's talk about your requirements.", buttons: [{ label: 'Contact Us Today', href: '/contact' }] } }
];

const testimonialsSections = [
    { kind: 'StatsStrip', order: 0, visible: true, data: { variant: 'chips', items: [{ value: '4+', label: 'Major Clients' }, { value: '6+', label: 'Years Track Record' }, { value: '100%', label: 'Commitment to Quality' }] } },
    { kind: 'TestimonialGrid', order: 1, visible: true, data: { label: 'Client Voices', title: 'What Our Partners Say', sectionBg: 'bc-section-white' } },
    { kind: 'StatsStrip', order: 2, visible: true, data: { variant: 'strip', items: [{ value: '4+', label: 'Satisfied Clients' }, { value: '2019', label: 'First Engagement' }, { value: '6', label: 'Years of Trust' }, { value: '100%', label: 'Safety Record' }] } },
    { kind: 'ClientCardGrid', order: 3, visible: true, data: { label: 'Our Client Portfolio', title: 'Our Client Portfolio', sectionBg: 'bc-section-light', variant: 'cardsWithBadge', intro: 'From multinational oilfield services companies to regional operators, BerCom has delivered across diverse sectors.' } },
    { kind: 'CtaBanner', order: 4, visible: true, data: { label: "Let's Collaborate", title: 'Ready to Work With BerCom?', theme: 'dark', text: 'Become one of our valued partners. Our team is ready to deliver tailored solutions for your operational needs.', buttons: [{ label: 'Contact Us', href: '/contact' }] } }
];

const contactSections = [
    {
        kind: 'ContactSection', order: 0, visible: true, anchorId: 'contact-form', data: {
            label: 'Send a Message', title: 'Get In Touch With Our Team',
            intro: 'Complete the form below and one of our specialists will respond within one business day.',
            showMiniCards: true, showDetailsCard: true, showForm: true, showBusinessHours: true, showMapPlaceholder: true,
            mapHeading: 'Our Office Location', submitLabel: 'Send Message',
            businessHours: { note: "We're available Mon–Fri 8am–6pm WAT. Urgent operational enquiries are handled 24/7.", rows: [{ day: 'Monday – Friday', hours: '8:00 am – 6:00 pm WAT' }, { day: 'Saturday', hours: 'By appointment' }, { day: 'Sunday', hours: 'Closed' }] },
            formFields: [
                { name: 'fullName', label: 'Full Name', type: 'text', required: true, half: true, placeholder: 'Your full name' },
                { name: 'company', label: 'Company', type: 'text', required: false, half: true, placeholder: 'Your company name' },
                { name: 'email', label: 'Email Address', type: 'email', required: true, half: true, placeholder: 'your@email.com' },
                { name: 'phone', label: 'Phone Number', type: 'tel', required: false, half: true, placeholder: '+240 000 000 000' },
                { name: 'service', label: 'Service Interest', type: 'select', required: false, half: false, options: [
                    { value: 'offshore', label: 'Offshore Support Vessels' }, { value: 'chandelling', label: 'Ship Chandelling' },
                    { value: 'manpower', label: 'Manpower Supply' }, { value: 'qhse', label: 'QHSE Training & Consultancy' },
                    { value: 'personnel', label: 'Personnel Support Services' }, { value: 'supply', label: 'General Supply Services' },
                    { value: 'ndt', label: 'NDT & Inspection' }, { value: 'catalyst', label: 'Catalyst Handling & Mechanical' }, { value: 'other', label: 'Other / General Enquiry' }
                ] },
                { name: 'message', label: 'Message', type: 'textarea', required: true, half: false, placeholder: 'Describe your requirements or enquiry...' }
            ]
        }
    },
    { kind: 'CtaBanner', order: 1, visible: true, data: { label: 'Urgent Enquiry?', title: 'Have an Urgent Request?', theme: 'light', text: "Our operations team is available around the clock for time-critical offshore and logistics requirements. Don't hesitate to call or email us directly.", buttons: [{ label: '+240 222 196 144', href: 'tel:+240222196144', icon: 'phone' }, { label: 'Send Email', href: 'mailto:contactus@bercomservices.com', icon: 'email' }] } }
];

const pages = [
    { slug: 'home', title: 'BerCom Services — Integrated Oil & Gas Solutions | Malabo, Equatorial Guinea', metaDescription: 'BerCom Services — indigenous oil & gas company in Malabo providing offshore vessel support, NDT, manpower, QHSE training, catalyst handling and logistics since 2018.', metaKeywords: 'BerCom Services, oil gas Equatorial Guinea, offshore support vessels, NDT inspection, QHSE training, Malabo, catalyst handling', pageHero: { label: '', title: '' }, sections: homeSections },
    { slug: 'about', title: 'About Us — BerCom Services | Oil & Gas, Malabo, Equatorial Guinea', metaDescription: 'Learn about BerCom Services — an indigenous oil & gas company founded in 2018, headquartered in Malabo, Equatorial Guinea. Our mission, vision, core values and ISO certifications.', metaKeywords: 'BerCom Services about, oil gas company Equatorial Guinea, Malabo, ISO certifications, QHSE, indigenous company', pageHero: { label: '', title: 'About Us' }, sections: aboutSections },
    { slug: 'services', title: 'Our Services — BerCom Services | Offshore, QHSE, NDT & More | Malabo, Equatorial Guinea', metaDescription: 'BerCom Services offers 8 integrated oil & gas services in Malabo, Equatorial Guinea: Offshore Support Vessels, Ship Chandelling, Manpower Supply, QHSE Training, Personnel Support, General Supply, NDT & Inspection, and Catalyst Handling.', metaKeywords: 'BerCom Services, offshore support vessels, ship chandelling, manpower supply, QHSE training, Malabo services', pageHero: { label: 'What We Do', title: 'Our Services' }, sections: servicesSections },
    { slug: 'courses', title: 'Training & Courses — BerCom Services | QHSE, ISO, HSE Training Malabo', metaDescription: 'Professional QHSE, ISO lead auditor and HSE safety training courses by BerCom Services in Malabo, Equatorial Guinea. Pricing on request.', metaKeywords: '', pageHero: { label: '', title: 'Training & Courses' }, sections: coursesSections },
    { slug: 'team', title: 'Our Team — BerCom Services | Oil & Gas Experts, Malabo', metaDescription: 'Meet the BerCom Services management team — experienced oil & gas professionals delivering offshore operations, QHSE training, NDT and logistics from Malabo, Equatorial Guinea.', metaKeywords: 'BerCom Services team, oil gas experts Malabo, management team Equatorial Guinea', pageHero: { label: 'BerCom Services', title: 'Our Team' }, sections: teamSections },
    { slug: 'testimonials', title: 'Testimonials — BerCom Services | Client Reviews, Oil & Gas Malabo', metaDescription: 'What BerCom Services clients say — testimonials from Baker Hughes, Altus Intervention, AMPCO and more. Trusted indigenous oil & gas partner in Equatorial Guinea.', metaKeywords: '', pageHero: { label: '', title: 'Client Testimonials' }, sections: testimonialsSections },
    { slug: 'contact', title: 'Contact Us — BerCom Services | Malabo, Equatorial Guinea', metaDescription: 'Contact BerCom Services — indigenous oil & gas company based in Malabo, Equatorial Guinea. Reach us by phone, email or visit our office in Edificio Davinchi Malabo II.', metaKeywords: 'BerCom Services contact, oil gas Equatorial Guinea, Malabo contact, offshore services enquiry', pageHero: { label: "We'd Love to Hear From You", title: 'Contact Us' }, sections: contactSections }
];

async function run() {
    await connectDB();

    const existingCount = await Page.countDocuments();
    if (existingCount > 0) {
        console.log(`Found ${existingCount} existing page(s) — migration already ran. Skipping.`);
        process.exit(0);
    }

    await Service.insertMany(services);
    await IsoStandard.insertMany(isoStandards);
    await Client.insertMany(clients);
    await TeamMember.insertMany(teamMembers);
    await Testimonial.insertMany(testimonials);
    await Course.insertMany(courses);
    await Page.insertMany(pages);

    const settings = await SiteSettings.getSingleton();
    Object.assign(settings, siteSettingsData);
    settings.socialLinks = siteSettingsData.socialLinks;
    settings.footer = siteSettingsData.footer;
    settings.research = siteSettingsData.research;
    await settings.save();

    console.log('Migration complete:');
    console.log(`  ${services.length} services, ${isoStandards.length} ISO standards, ${clients.length} clients`);
    console.log(`  ${teamMembers.length} team members, ${testimonials.length} testimonials, ${courses.length} courses`);
    console.log(`  ${pages.length} pages, site settings saved`);
    process.exit(0);
}

run().catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
});
