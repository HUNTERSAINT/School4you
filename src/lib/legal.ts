/** Bump the version whenever the Terms or Privacy Policy change in a way users must re-accept. */
export const TERMS_VERSION = "2026-11-03";

export const LEGAL = {
  product: "School4you",
  company: "Mazi Saint Concepts",
  phone: "07065599931",
  country: "Nigeria",
  updated: "3 November 2026",
  // Remove this banner only after a Nigerian lawyer has reviewed and approved the text.
  showDraftBanner: true,
};

export type LegalSection = { title: string; body: string[] };

export const TERMS: LegalSection[] = [
  { title: "1. About these terms", body: [
    "School4you is a web application, operated by Mazi Saint Concepts (\"we\", \"us\"), that helps schools manage student records, school fees, academic results and attendance.",
    "By creating a school account or using School4you you agree to these Terms and to our Privacy Policy. If you accept on behalf of a school, you confirm that you are authorised to bind that school.",
  ]},
  { title: "2. Accounts", body: [
    "The administrator who registers a school is responsible for that school's account, for the staff accounts created under it, and for keeping passwords secret. Give each person their own login and deactivate accounts of people who leave.",
    "You must provide accurate information and tell us promptly if you suspect unauthorised access.",
  ]},
  { title: "3. Student and guardian data", body: [
    "The school decides what personal data about students, guardians and staff is entered, and why. The school is the data controller and we act as its data processor, handling that data only to provide School4you (see the Privacy Policy).",
    "The school confirms that it has a lawful basis to enter this data, including the consent of parents or guardians where required, and that it will keep the data accurate. Student data includes information about children, which calls for particular care.",
  ]},
  { title: "4. Fees and payments", body: [
    "Online fee payments are processed by Paystack, a third party. We do not store card or bank details. Fee money is settled to the school through the school's own Paystack subaccount, not to us.",
    "Invoices, amounts and refunds are matters between the school and the paying parent or guardian. We are not a bank or a party to the school's fee arrangements, and we are not responsible for Paystack's availability or charges.",
  ]},
  { title: "5. Acceptable use", body: [
    "You must not use School4you unlawfully, try to access another school's data, probe or disrupt the service, upload malicious code, or use it to harass or harm anyone. We may suspend accounts that put the service or other users at risk.",
  ]},
  { title: "6. Results and records", body: [
    "School4you calculates totals, grades and positions from the scores a school enters. The school is responsible for checking that scores, grading rules, fee records and attendance are correct before relying on or issuing them.",
  ]},
  { title: "7. Availability and backups", body: [
    "We work to keep the service running but do not promise that it will be uninterrupted or error-free. Schools should keep their own copies of important records, and can download their data from Settings at any time.",
  ]},
  { title: "8. Liability", body: [
    "To the extent allowed by law, School4you is provided \"as is\", and we are not liable for indirect or consequential loss, lost profits, or loss caused by incorrect data entered by users, third-party services, or events outside our reasonable control. Nothing in these Terms limits liability that cannot lawfully be limited.",
  ]},
  { title: "9. Ending your account", body: [
    "A school may stop using School4you at any time and may export its data first. We may suspend or end accounts that breach these Terms. On request, and subject to legal record-keeping duties, we will delete a school's data.",
  ]},
  { title: "10. Changes and governing law", body: [
    "We may update these Terms and will show the new version date. Continued use after a change means you accept it. These Terms are governed by the laws of the Federal Republic of Nigeria.",
  ]},
  { title: "11. Contact", body: [`${LEGAL.company}, ${LEGAL.country}. Phone: ${LEGAL.phone}.`] },
];

export const PRIVACY: LegalSection[] = [
  { title: "1. Who we are", body: [
    `${LEGAL.product} is operated by ${LEGAL.company}. For the personal data a school enters, the school is the controller and ${LEGAL.company} is the processor. For account and security data about school users, we act as controller.`,
  ]},
  { title: "2. What we collect", body: [
    "School details: name, email, phone and address.",
    "Staff and administrator accounts: name, email address, role and an encrypted (hashed) password.",
    "Student records entered by the school: name, admission number, class, date of birth, sex, state of origin, guardian name, phone and email, attendance, examination scores and grades, fee invoices and payment status.",
    "Payment references from Paystack. We do not receive or store card or bank account details.",
    "Technical data: IP address and request logs used to run and protect the service, and one session cookie that keeps you signed in.",
  ]},
  { title: "3. Why we use it", body: [
    "To provide School4you: run school records, fees, results and attendance; sign users in; send account emails such as verification and password reset; keep the service secure and prevent abuse; and meet legal obligations. We do not sell personal data and we do not use student data for advertising.",
  ]},
  { title: "4. Children's data", body: [
    "Schools enter information about children. Only the school's own authorised users can see it, teachers see only the classes assigned to them, and guardian contact details are limited to administrators and bursars. Schools must have the consent or legal basis needed to record this data.",
  ]},
  { title: "5. Who else handles the data", body: [
    "Railway hosts the application and database (our database is hosted in the Netherlands, European Union). Paystack processes fee payments. Resend delivers account emails. These providers handle data only to provide their service to us. Data may also be disclosed where the law requires it.",
  ]},
  { title: "6. Cookies", body: [
    "We use one essential cookie to keep you signed in. It is not used for tracking or advertising, so no cookie banner is needed.",
  ]},
  { title: "7. How long we keep it", body: [
    "School data is kept while the school's account is active. Schools can export it, and can erase a student's personal details, from within School4you. When a school asks us to delete its account we will do so, except for records we must keep by law. Backups may take a short time to clear.",
  ]},
  { title: "8. Security", body: [
    "Passwords are hashed, sessions are signed and can be revoked, connections use HTTPS, every school's data is separated from other schools, access depends on a person's role, and important actions are recorded in an audit log. No system is completely secure, so please use strong passwords and tell us about any suspected breach.",
  ]},
  { title: "9. Your rights", body: [
    "You may ask to see, correct, export or delete personal data, to object to certain uses, and to complain to the Nigeria Data Protection Commission. Parents and guardians should first contact the school, which controls their child's records; we will help the school respond.",
  ]},
  { title: "10. Breaches and changes", body: [
    "If a personal data breach affects your data, we will notify the school and, where the law requires, the regulator, without undue delay. We may update this policy and will show the new date.",
  ]},
  { title: "11. Contact", body: [`${LEGAL.company}, ${LEGAL.country}. Phone: ${LEGAL.phone}.`] },
];
