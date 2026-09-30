import bcrypt from 'bcryptjs';
import { query, initDb } from './index';

async function seed() {
  console.log('🌱 Starting QueueLess database seed...');
  await initDb();

  // Clear existing data cleanly in cascade order
  await query('DELETE FROM notifications');
  await query('DELETE FROM token_events');
  await query('DELETE FROM tokens');
  await query('DELETE FROM counters');
  await query('DELETE FROM services');
  await query('DELETE FROM locations');
  await query('DELETE FROM users');

  console.log('🧹 Cleaned existing tables.');

  // Password hash for 'Password123!'
  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Seed Users
  const superadminRes = await query<{ id: string }>(
    `INSERT INTO users (email, password_hash, full_name, phone, role)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    ['superadmin@queueless.io', passwordHash, 'Elena Rostova', '+1 (555) 000-0001', 'superadmin']
  );
  const superadminId = superadminRes.rows[0].id;

  const adminRes = await query<{ id: string }>(
    `INSERT INTO users (email, password_hash, full_name, phone, role)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    ['admin@queueless.io', passwordHash, 'Dr. Sarah Mitchell', '+1 (555) 010-0002', 'admin']
  );
  const adminId = adminRes.rows[0].id;

  const operatorRes = await query<{ id: string }>(
    `INSERT INTO users (email, password_hash, full_name, phone, role)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    ['operator@queueless.io', passwordHash, 'Marcus Vance', '+1 (555) 010-0003', 'operator']
  );
  const operatorId = operatorRes.rows[0].id;

  const citizenRes = await query<{ id: string }>(
    `INSERT INTO users (email, password_hash, full_name, phone, role)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    ['citizen@queueless.io', passwordHash, 'Alex Rivera', '+1 (555) 010-0004', 'citizen']
  );
  const citizenId = citizenRes.rows[0].id;

  console.log('👤 Created default users: superadmin, admin, operator, citizen.');

  // 2. Seed Locations
  const locationsData = [
    {
      name: 'Metro General Hospital & Diagnostic Pavilion',
      slug: 'metro-general-hospital',
      category: 'healthcare',
      address: '450 Lexington Ave, Suite 300',
      city: 'New York',
      latitude: 40.7516,
      longitude: -73.9755,
      description: 'Premier regional acute medical center providing ambulatory care, OPD consultations, diagnostic imaging, and pharmacy services.',
      created_by: adminId,
    },
    {
      name: 'Apex National Bank & Trust Center',
      slug: 'apex-national-bank',
      category: 'banking',
      address: '100 South Wacker Drive',
      city: 'Chicago',
      latitude: 41.8819,
      longitude: -87.6375,
      description: 'Full-service financial center handling personal cash transactions, foreign currency exchange, commercial mortgages, and wealth onboarding.',
      created_by: adminId,
    },
    {
      name: 'City Regional Transport Office (RTO / DMV)',
      slug: 'city-regional-transport-office',
      category: 'government',
      address: '1355 Market Street, Civic Plaza',
      city: 'San Francisco',
      latitude: 37.7766,
      longitude: -122.4173,
      description: 'Department of Motor Vehicles & Regional Transit handling biometric driver licenses, vehicle title changes, and public transport passes.',
      created_by: adminId,
    },
    {
      name: 'Greenfield University Student Center & Registry',
      slug: 'greenfield-university-center',
      category: 'education',
      address: '77 Massachusetts Avenue, Building 10',
      city: 'Cambridge',
      latitude: 42.3598,
      longitude: -71.0921,
      description: 'Central student service hub managing tuition settlement, official degree transcripts, international student visas, and career advisory.',
      created_by: adminId,
    },
    {
      name: 'Metro Water & Power Consumer Utility Desk',
      slug: 'metro-water-power-desk',
      category: 'utility',
      address: '700 5th Avenue, Municipal Tower',
      city: 'Seattle',
      latitude: 47.6052,
      longitude: -122.3301,
      description: 'City utility dispatch and customer dispute desk for high bill audits, smart meter replacement appointments, and green rebate claims.',
      created_by: adminId,
    },
    {
      name: 'BioHealth Diagnostics & Blood Pathology Lab',
      slug: 'biohealth-diagnostics-lab',
      category: 'healthcare',
      address: '200 Congress Avenue, Medical Arts Wing',
      city: 'Austin',
      latitude: 30.2642,
      longitude: -97.7431,
      description: 'State-of-the-art diagnostic testing facility providing rapid blood work, hormone panels, and pre-surgical clearances.',
      created_by: adminId,
    },
  ];

  const locationIds: Record<string, string> = {};
  for (const loc of locationsData) {
    const locRes = await query<{ id: string }>(
      `INSERT INTO locations (name, slug, category, address, city, latitude, longitude, description, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [loc.name, loc.slug, loc.category, loc.address, loc.city, loc.latitude, loc.longitude, loc.description, loc.created_by]
    );
    locationIds[loc.slug] = locRes.rows[0].id;
  }
  console.log(`🏥 Created ${locationsData.length} locations across 5 categories.`);

  // 3. Seed Services
  const servicesData = [
    // Metro General Hospital
    {
      location_slug: 'metro-general-hospital',
      name: 'General OPD Consultation',
      description: 'Physician triage, outpatient diagnostic review, and prescriptions.',
      average_service_time_minutes: 12,
    },
    {
      location_slug: 'metro-general-hospital',
      name: 'Blood & Pathology Diagnostic Lab',
      description: 'Fast blood draw, routine CBC, lipid profile, and urinalysis collection.',
      average_service_time_minutes: 6,
    },
    {
      location_slug: 'metro-general-hospital',
      name: 'Hospital Pharmacy & Dispensing',
      description: 'Prescription pickup, medication dosage counsel, and refills.',
      average_service_time_minutes: 5,
    },
    // Apex National Bank
    {
      location_slug: 'apex-national-bank',
      name: 'Teller & Cash Services',
      description: 'Deposits, withdrawals, official cashier checks, and wire transfers.',
      average_service_time_minutes: 5,
    },
    {
      location_slug: 'apex-national-bank',
      name: 'Loan Inquiries & Mortgage Advisory',
      description: 'Home loan approvals, small business lines of credit, and refinancing.',
      average_service_time_minutes: 20,
    },
    {
      location_slug: 'apex-national-bank',
      name: 'New Account Onboarding & KYC',
      description: 'Premium checking accounts, business registrations, and digital signature setup.',
      average_service_time_minutes: 14,
    },
    // City RTO
    {
      location_slug: 'city-regional-transport-office',
      name: "Driver's License Renewal & Photo Biometrics",
      description: 'Photo capture, eye exams, and international driving permit validations.',
      average_service_time_minutes: 8,
    },
    {
      location_slug: 'city-regional-transport-office',
      name: 'Vehicle Title & Registration Verification',
      description: 'Vehicle ownership transfer, plate reissue, and smog check verification.',
      average_service_time_minutes: 11,
    },
    // Greenfield University
    {
      location_slug: 'greenfield-university-center',
      name: 'Tuition Settlement & Financial Aid Desk',
      description: 'Scholarship verification, semester payment plans, and student bursar holds.',
      average_service_time_minutes: 9,
    },
    {
      location_slug: 'greenfield-university-center',
      name: 'Official Transcripts & Degree Attestation',
      description: 'Sealed academic transcripts, graduation seals, and notarized credentials.',
      average_service_time_minutes: 5,
    },
    // Metro Utility
    {
      location_slug: 'metro-water-power-desk',
      name: 'Billing Discrepancies & Meter Audits',
      description: 'Review unexpected consumption spikes, leak credits, and bill adjustments.',
      average_service_time_minutes: 10,
    },
    // BioHealth Diagnostics
    {
      location_slug: 'biohealth-diagnostics-lab',
      name: 'Fasting Blood Panels & Sample Intake',
      description: 'Morning fasting blood tests and specialty lab kit drop-off.',
      average_service_time_minutes: 6,
    },
  ];

  const serviceMap: Record<string, string> = {};
  for (const s of servicesData) {
    const sRes = await query<{ id: string }>(
      `INSERT INTO services (location_id, name, description, average_service_time_minutes)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [locationIds[s.location_slug], s.name, s.description, s.average_service_time_minutes]
    );
    serviceMap[s.name] = sRes.rows[0].id;
  }
  console.log(`📋 Created ${servicesData.length} public services.`);

  // 4. Seed Counters
  const opdServiceId = serviceMap['General OPD Consultation'];
  const tellerServiceId = serviceMap['Teller & Cash Services'];
  const rtoLicenseId = serviceMap["Driver's License Renewal & Photo Biometrics"];

  // OPD Counters
  const opdCounter1 = (
    await query<{ id: string }>(
      `INSERT INTO counters (service_id, name, is_open, current_operator_id)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [opdServiceId, 'Counter A1 - Dr. Mitchell', true, operatorId]
    )
  ).rows[0].id;

  const opdCounter2 = (
    await query<{ id: string }>(
      `INSERT INTO counters (service_id, name, is_open, current_operator_id)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [opdServiceId, 'Counter A2 - Dr. Vance', true, null]
    )
  ).rows[0].id;

  const opdCounter3 = (
    await query<{ id: string }>(
      `INSERT INTO counters (service_id, name, is_open, current_operator_id)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [opdServiceId, 'Counter A3 - Triage Desk', false, null]
    )
  ).rows[0].id;

  // Bank Teller Counters
  const bankCounter1 = (
    await query<{ id: string }>(
      `INSERT INTO counters (service_id, name, is_open, current_operator_id)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [tellerServiceId, 'Window 1 - Express Cash', true, null]
    )
  ).rows[0].id;

  const bankCounter2 = (
    await query<{ id: string }>(
      `INSERT INTO counters (service_id, name, is_open, current_operator_id)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [tellerServiceId, 'Window 2 - Commercial Deposits', true, null]
    )
  ).rows[0].id;

  // RTO Counters
  const rtoCounter1 = (
    await query<{ id: string }>(
      `INSERT INTO counters (service_id, name, is_open, current_operator_id)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [rtoLicenseId, 'Station 1 - Biometrics & Vision', true, null]
    )
  ).rows[0].id;

  // Add default counters for all other services
  for (const s of servicesData) {
    const sId = serviceMap[s.name];
    if (sId !== opdServiceId && sId !== tellerServiceId && sId !== rtoLicenseId) {
      await query(
        `INSERT INTO counters (service_id, name, is_open)
         VALUES ($1, 'Counter 1', true), ($1, 'Counter 2', true)`,
        [sId]
      );
    }
  }

  console.log('🪟 Created counters for all services.');

  // 5. Seed Historical Completed Tokens for Analytics (Last few hours)
  const now = new Date();
  const pastTimes = [
    { minsAgo: 110, duration: 11 },
    { minsAgo: 95, duration: 13 },
    { minsAgo: 80, duration: 10 },
    { minsAgo: 65, duration: 12 },
    { minsAgo: 50, duration: 14 },
    { minsAgo: 35, duration: 11 },
    { minsAgo: 20, duration: 12 },
    { minsAgo: 10, duration: 9 },
  ];

  let completedIdx = 100;
  for (const item of pastTimes) {
    completedIdx++;
    const joinedAt = new Date(now.getTime() - item.minsAgo * 60 * 1000);
    const calledAt = new Date(joinedAt.getTime() + 15 * 60 * 1000);
    const completedAt = new Date(calledAt.getTime() + item.duration * 60 * 1000);

    const tokRes = await query<{ id: string }>(
      `INSERT INTO tokens (token_number, service_id, counter_id, citizen_name, citizen_phone, citizen_email, status, position_in_queue, estimated_wait_minutes, joined_at, called_at, completed_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'completed', 0, 0, $7, $8, $9) RETURNING id`,
      [
        `OPD-${completedIdx}`,
        opdServiceId,
        opdCounter1,
        `Patient ${completedIdx}`,
        `+1 555-019-${completedIdx}`,
        `patient${completedIdx}@example.com`,
        joinedAt.toISOString(),
        calledAt.toISOString(),
        completedAt.toISOString(),
      ]
    );

    await query(
      `INSERT INTO token_events (token_id, event_type, operator_id, created_at)
       VALUES ($1, 'completed', $2, $3)`,
      [tokRes.rows[0].id, operatorId, completedAt.toISOString()]
    );
  }

  // 6. Seed Current Serving Token at Counter A1
  const servingTokenRes = await query<{ id: string }>(
    `INSERT INTO tokens (token_number, service_id, counter_id, citizen_name, citizen_phone, citizen_email, status, position_in_queue, estimated_wait_minutes, joined_at, called_at)
     VALUES ($1, $2, $3, $4, $5, $6, 'serving', 0, 0, $7, $8) RETURNING id`,
    [
      'OPD-109',
      opdServiceId,
      opdCounter1,
      'Eleanor Vance',
      '+1 (555) 432-1090',
      'eleanor.vance@example.com',
      new Date(now.getTime() - 25 * 60 * 1000).toISOString(),
      new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
    ]
  );
  await query(
    `INSERT INTO token_events (token_id, event_type, operator_id, created_at)
     VALUES ($1, 'serving', $2, NOW())`,
    [servingTokenRes.rows[0].id, operatorId]
  );

  // 7. Seed Active Waiting Tokens in OPD Queue
  // Token 1: Alex Rivera (Our demo citizen!)
  const alexTokenRes = await query<{ id: string }>(
    `INSERT INTO tokens (token_number, service_id, user_id, citizen_name, citizen_phone, citizen_email, status, position_in_queue, estimated_wait_minutes, joined_at, notes)
     VALUES ($1, $2, $3, $4, $5, $6, 'waiting', 1, 6, $7, $8) RETURNING id`,
    [
      'OPD-110',
      opdServiceId,
      citizenId,
      'Alex Rivera',
      '+1 (555) 010-0004',
      'citizen@queueless.io',
      new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
      'Annual health checkup and routine follow-up',
    ]
  );
  await query(
    `INSERT INTO token_events (token_id, event_type, created_at)
     VALUES ($1, 'joined', $2)`,
    [alexTokenRes.rows[0].id, new Date(now.getTime() - 15 * 60 * 1000).toISOString()]
  );

  // Alex Notification
  await query(
    `INSERT INTO notifications (user_id, token_id, title, body, is_read)
     VALUES ($1, $2, 'Queue Update: You are #1 Next!', 'Dr. Mitchell at Counter A1 will be calling token OPD-110 shortly. Please proceed to the waiting lobby.', false)`,
    [citizenId, alexTokenRes.rows[0].id]
  );

  // Other waiting tokens
  const waitingTokens = [
    { num: 'OPD-111', name: 'Sophia Chen', mins: 12, pos: 2, wait: 12, phone: '+1 555-234-5678', email: 'sophia.c@example.com' },
    { num: 'OPD-112', name: 'David Kim', mins: 8, pos: 3, wait: 18, phone: '+1 555-345-6789', email: 'david.k@example.com' },
    { num: 'OPD-113', name: 'Fatima Al-Mansoor', mins: 5, pos: 4, wait: 24, phone: '+1 555-456-7890', email: 'fatima.m@example.com' },
    { num: 'OPD-114', name: 'James Wilson', mins: 2, pos: 5, wait: 30, phone: '+1 555-567-8901', email: 'james.w@example.com' },
  ];

  for (const wt of waitingTokens) {
    const tRes = await query<{ id: string }>(
      `INSERT INTO tokens (token_number, service_id, citizen_name, citizen_phone, citizen_email, status, position_in_queue, estimated_wait_minutes, joined_at)
       VALUES ($1, $2, $3, $4, $5, 'waiting', $6, $7, $8) RETURNING id`,
      [
        wt.num,
        opdServiceId,
        wt.name,
        wt.phone,
        wt.email,
        wt.pos,
        wt.wait,
        new Date(now.getTime() - wt.mins * 60 * 1000).toISOString(),
      ]
    );
    await query(
      `INSERT INTO token_events (token_id, event_type, created_at)
       VALUES ($1, 'joined', $2)`,
      [tRes.rows[0].id, new Date(now.getTime() - wt.mins * 60 * 1000).toISOString()]
    );
  }

  // 8. Seed Bank Tokens
  await query(
    `INSERT INTO tokens (token_number, service_id, counter_id, citizen_name, status, position_in_queue, estimated_wait_minutes, joined_at, called_at)
     VALUES ('BNK-201', $1, $2, 'Robert Taylor', 'serving', 0, 0, NOW() - INTERVAL '10 minutes', NOW() - INTERVAL '3 minutes')`,
    [tellerServiceId, bankCounter1]
  );
  await query(
    `INSERT INTO tokens (token_number, service_id, citizen_name, status, position_in_queue, estimated_wait_minutes, joined_at)
     VALUES 
      ('BNK-202', $1, 'Grace Hopper', 'waiting', 1, 5, NOW() - INTERVAL '8 minutes'),
      ('BNK-203', $1, 'Alan Turing', 'waiting', 2, 10, NOW() - INTERVAL '4 minutes')`,
    [tellerServiceId]
  );

  // 9. Seed RTO Tokens
  await query(
    `INSERT INTO tokens (token_number, service_id, counter_id, citizen_name, status, position_in_queue, estimated_wait_minutes, joined_at, called_at)
     VALUES ('RTO-301', $1, $2, 'Carlos Santana', 'serving', 0, 0, NOW() - INTERVAL '12 minutes', NOW() - INTERVAL '4 minutes')`,
    [rtoLicenseId, rtoCounter1]
  );
  await query(
    `INSERT INTO tokens (token_number, service_id, citizen_name, status, position_in_queue, estimated_wait_minutes, joined_at)
     VALUES 
      ('RTO-302', $1, 'Priya Sharma', 'waiting', 1, 8, NOW() - INTERVAL '6 minutes'),
      ('RTO-303', $1, 'Dmitri Volkov', 'waiting', 2, 16, NOW() - INTERVAL '2 minutes')`,
    [rtoLicenseId]
  );

  console.log('🎫 Seeded active waiting & serving tokens across queues.');
  console.log('✅ QueueLess database seeded successfully!');
  console.log('\n--- Default Credentials ---');
  console.log('Superadmin : superadmin@queueless.io / Password123!');
  console.log('Admin      : admin@queueless.io / Password123!');
  console.log('Operator   : operator@queueless.io / Password123!');
  console.log('Citizen    : citizen@queueless.io / Password123!');
  console.log('Alex Active Token : OPD-110 (Tracking ID available in Alex’s dashboard)');
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  });
