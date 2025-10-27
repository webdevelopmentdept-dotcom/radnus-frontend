const jobsData = [
  {
    title: "Graphic Designer",
    type: "Design & Creative",
    duration: "Full-Time",
    salary: "₹25,000 – ₹35,000 / month",
    experience: "1–3 Years",
    posted: "2 days ago",
    description:
      "We are seeking a talented Graphic Designer to create visually engaging content that strengthens our brand identity. You will be responsible for designing digital and print assets, collaborating with the marketing team to develop creative concepts, and ensuring brand consistency across all platforms.",
    responsibilities: [
      "Design visually appealing assets for digital and print media.",
      "Collaborate with marketing and content teams to develop creative campaigns.",
      "Ensure brand guidelines are consistently followed across all materials.",
      "Review and refine designs based on feedback from stakeholders.",
      "Stay updated with design trends to enhance creative outputs.",
    ],
    requirements: [
      "Proficiency in Adobe Creative Suite (Photoshop, Illustrator, InDesign).",
      "Strong portfolio demonstrating creative and innovative designs.",
      "Attention to detail and ability to meet deadlines.",
      "Good communication and teamwork skills.",
      "Bachelor’s degree or diploma in Design or related field.",

    ],
  },
  {
    title: "Digital Marketing Executive",
    type: "Sales & Marketing",
    duration: "Full-Time",
    salary: "₹20,000 – ₹30,000 / month",
    experience: "1–3 Years",
    posted: "5 days ago",
    description:
      "We are seeking a Digital Marketing Executive to drive and optimize marketing campaigns. You will be responsible for planning and executing campaigns, monitoring analytics, and collaborating with content creators to enhance engagement and brand visibility.",
    responsibilities: [
      "Plan and execute digital marketing campaigns across channels.",
      "Monitor campaign performance and optimize for maximum results.",
      "Collaborate with content creators to produce engaging materials.",
      "Conduct market research and competitor analysis.",
      "Report insights and recommendations to improve marketing strategy.",
    ],
    requirements: [
      "Knowledge of SEO, SEM, and social media marketing.",
      "Experience with Google Ads, Facebook Ads, and analytics tools.",
      "Strong communication and analytical skills.",
      "Ability to manage multiple projects and meet deadlines.",
      "Bachelor’s degree in Marketing, Business, or related field.",

    ],
  },
  {
    title: "Customer Support Executive",
    type: "Customer Support / Telecalling",
    duration: "Full-Time",
    salary: "₹18,000 – ₹25,000 / month",
    experience: "Fresher",
    posted: "1 week ago",
    description:
      "We are seeking a Customer Support Executive to provide exceptional service to our clients. You will handle inquiries, maintain records, resolve complaints efficiently, and escalate issues when necessary.",
    responsibilities: [
      "Respond to customer queries via phone, email, and chat.",
      "Maintain accurate records of customer interactions.",
      "Resolve complaints and ensure timely follow-up.",
      "Escalate complex issues to senior management when required.",
      "Contribute to process improvements for better customer service.",
    ],
    requirements: [
      "Excellent communication and interpersonal skills.",
      "Ability to handle multiple tasks and prioritize effectively.",
      "Basic knowledge of CRM software is a plus.",
      "Problem-solving skills and attention to detail.",
      "Fresher candidates (2022–2025 pass-outs preferred).",
  
    ],
  },
  {
    title: "Software Developer Intern",
    type: "Software & Development",
    duration: "Internship",
    salary: "₹10,000 / month",
    experience: "Fresher",
    posted: "3 days ago",
    description:
      "We are seeking a Software Developer Intern to gain hands-on experience in web and software development. You will assist in building applications, writing clean and maintainable code, and collaborating with senior developers to learn best practices.",
    responsibilities: [
      "Assist in developing web applications and software solutions.",
      "Write clean, efficient, and maintainable code.",
      "Collaborate with senior developers to learn coding best practices.",
      "Participate in testing and debugging applications.",
      "Document development processes and code changes.",
    ],
    requirements: [
      "Basic knowledge of JavaScript, HTML, CSS, and React.",
      "Eagerness to learn and ability to work in a team.",
      "Problem-solving skills and attention to detail.",
      "Good communication skills.",
      "Fresher candidates (2022–2023 pass-outs preferred).",

    ],
  },
  {
    title: "Digital Marketing Intern",
    type: "Sales & Marketing",
    duration: "Internship",
    salary: "₹10,000 / month",
    experience: "Fresher",
    posted: "4 days ago",
    description:
      "We are seeking a Digital Marketing Intern to assist in planning and executing online marketing campaigns. You will support content creation, monitor engagement metrics, and collaborate with the marketing team to enhance brand visibility and digital reach.",
    responsibilities: [
      "Assist in planning and executing online marketing campaigns.",
      "Create content for social media platforms and blogs.",
      "Monitor engagement metrics and prepare reports.",
      "Conduct research on market trends and competitors.",
      "Support the marketing team in day-to-day operations.",
    ],
    requirements: [
      "Basic understanding of digital marketing concepts.",
      "Good communication and writing skills.",
      "Proficiency with social media platforms and Microsoft Office.",
      "Ability to work independently and in a team.",
      "Fresher candidates (2022–2023 pass-outs preferred).",

    ],
  },
  {
    title: "HR Executive",
    type: "Human Resources",
    duration: "Full-Time",
    salary: "₹25,000 – ₹40,000 / month",
    experience: "1–3 Years",
    posted: "4 days ago",
    description:
      "We are seeking an HR Executive to oversee employee relations, recruitment, and HR operations. You will maintain employee records, support onboarding, and implement initiatives to enhance employee engagement and organizational efficiency.",
    responsibilities: [
      "Assist in recruitment and onboarding processes.",
      "Maintain HR records and databases accurately.",
      "Support employee engagement and performance management initiatives.",
      "Ensure compliance with labor laws and HR policies.",
      "Contribute to HR process improvements and reporting.",
    ],
    requirements: [
      "Bachelor’s degree in HR, Business Administration, or related field.",
      "Good knowledge of HR practices and labor laws.",
      "Strong organizational and communication skills.",
      "Ability to handle confidential information with discretion.",

    ],
  },
  {
    title: "Business Development Associate",
    type: "Business Development",
    duration: "Full-Time",
    salary: "₹20,000 – ₹35,000 / month",
    experience: "1–3 Years",
    posted: "1 week ago",
    description:
      "We are seeking a Business Development Associate to drive sales and foster strong client relationships. You will identify new business opportunities, develop proposals, negotiate contracts, and collaborate with internal teams to support overall business growth.",
    responsibilities: [
      "Identify and approach potential clients and business partners.",
      "Develop proposals and negotiate contracts.",
      "Maintain relationships with existing clients for customer satisfaction.",
      "Support sales strategy and market research initiatives.",
      "Report sales progress and pipeline updates to management.",
    ],
    requirements: [
      "Strong communication and negotiation skills.",
      "Basic knowledge of sales strategies and market research.",
      "Proactive and target-driven mindset.",
      "Ability to work independently and in a team.",

    ],
  },
  {
    title: "Software Developer",
    type: "Software & Web Development",
    duration: "Full-Time",
    salary: "₹30,000 – ₹50,000 / month",
    experience: "1–3 Years",
    posted: "2 days ago",
    description:
      "We are seeking a Software Developer to design and develop robust web applications and backend systems. You will collaborate with UI/UX designers and product managers, participate in code reviews, and ensure adherence to coding standards and best practices.",
    responsibilities: [
      "Develop and maintain web applications and backend systems.",
      "Collaborate with UI/UX designers and product managers.",
      "Participate in code reviews and ensure coding standards.",
      "Test and debug applications to ensure high-quality deliverables.",
      "Document processes, code changes, and maintain version control.",
    ],
    requirements: [
      "Proficient in JavaScript, React, Node.js, and databases.",
      "Strong problem-solving skills and attention to detail.",
      "Ability to work independently and in a team.",
      "Good communication skills.",


    ],
  },
  {
    title: "Business Development Intern",
    type: "Business Development",
    duration: "Internship",
    salary: "₹10,000 / month",
    experience: "Fresher",
    posted: "3 days ago",
    description:
      "We are seeking a Business Development Intern to support sales and client outreach activities. You will assist in lead generation, prepare proposals, and collaborate with the sales team to gain practical experience in business development strategies.",
    responsibilities: [
      "Assist in client research and lead generation.",
      "Support the sales team in preparing presentations and proposals.",
      "Participate in meetings and note action points.",
      "Conduct market research and competitor analysis.",
      "Learn sales strategies and customer engagement techniques.",
    ],
    requirements: [
      "Good communication and interpersonal skills.",
      "Interest in sales and business growth.",
      "Ability to learn quickly and work in a team.",
      "Fresher candidates (2022–2023 pass-outs preferred).",
      "Proactive and eager to gain practical experience.",

    ],
  },
  {
    title: "HR Intern",
    type: "Human Resources",
    duration: "Internship",
    salary: "₹8,000 / month",
    experience: "Fresher",
    posted: "4 days ago",
    description:
      "We are seeking an HR Intern to gain hands-on experience in recruitment and employee engagement activities. You will assist in onboarding, support employee engagement initiatives, and maintain HR documentation under the guidance of the HR team.",
    responsibilities: [
      "Assist in recruitment and onboarding processes.",
      "Help organize and implement employee engagement initiatives.",
      "Maintain HR documentation and databases.",
      "Support HR reporting and compliance activities.",
      "Learn HR practices and processes under mentorship.",
    ],
    requirements: [
      "Basic understanding of HR practices.",
      "Good communication and organizational skills.",
      "Eagerness to learn and work in a team.",
      "Fresher candidates (2022–2023 pass-outs preferred).",
      "Ability to handle confidential information responsibly.",

    ],
  },
];

export default jobsData;
