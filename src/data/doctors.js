export const doctors = [
  {
    id: 1,
    name: "Dr. Sarah Johnson",
    specialty: "Cardiology",
    role: "Senior Cardiologist",
    gender: "Female",
    availability: "Today",
    rating: 4.9,
    experience: "12 years",
    image: "https://i.pravatar.cc/150?u=1",
    featured: true,
    experienceData: [
      { title: "Senior Cardiologist", institution: "St. Mary's Hospital", duration: "2018 - Present" },
      { title: "Cardiology Fellow", institution: "Mount Sinai Hospital", duration: "2014 - 2018" },
      { title: "Resident Physician", institution: "Mayo Clinic", duration: "2011 - 2014" }
    ],
    educationData: [
      { degree: "Ph.D. in Cardiovascular Sciences", university: "Harvard Medical School", year: "2011" },
      { degree: "M.D. in General Medicine", university: "Johns Hopkins University", year: "2007" }
    ],
    reviews: [
      { patientName: "Alice M.", rating: 5, comment: "Dr. Johnson is incredibly knowledgeable and took the time to explain everything clearly.", date: "April 12, 2026" },
      { patientName: "Mark T.", rating: 4, comment: "Very professional and empathetic. The consultation was thorough.", date: "March 28, 2026" },
      { patientName: "Sofia R.", rating: 5, comment: "One of the best cardiologists I've ever visited. Highly recommend!", date: "February 15, 2026" }
    ]
  },
  {
    id: 2,
    name: "Dr. Michael Chen",
    specialty: "Pediatrics",
    role: "Chief Pediatrician",
    gender: "Male",
    availability: "Tomorrow",
    rating: 4.8,
    experience: "8 years",
    image: "https://i.pravatar.cc/150?u=2",
    featured: false,
    experienceData: [
      { title: "Chief of Pediatrics", institution: "Children's Health Center", duration: "2020 - Present" },
      { title: "Pediatric Resident", institution: "UCSF Medical Center", duration: "2016 - 2020" }
    ],
    educationData: [
      { degree: "M.D. in Pediatrics", university: "Stanford University", year: "2016" }
    ],
    reviews: [
      { patientName: "John D.", rating: 5, comment: "Great with kids! My son was very comfortable during the checkup.", date: "May 1, 2026" },
      { patientName: "Sarah P.", rating: 5, comment: "Dr. Chen is patient and explains everything to parents very well.", date: "April 20, 2026" }
    ]
  },
  {
    id: 3,
    name: "Dr. Emily Davis",
    specialty: "Neurology",
    role: "Neurological Surgeon",
    gender: "Female",
    availability: "This Week",
    rating: 5.0,
    experience: "15 years",
    image: "https://i.pravatar.cc/150?u=3",
    featured: true,
    experienceData: [
      { title: "Senior Neurosurgeon", institution: "Neural Care Institute", duration: "2015 - Present" },
      { title: "Staff Surgeon", institution: "Cedars-Sinai", duration: "2009 - 2015" }
    ],
    educationData: [
      { degree: "Board Certification in Neurosurgery", university: "Columbia University", year: "2009" }
    ],
    reviews: [
      { patientName: "Robert H.", rating: 5, comment: "Life-changing surgery. I cannot thank Dr. Davis enough.", date: "April 5, 2026" }
    ]
  },
  {
    id: 4,
    name: "Dr. James Wilson",
    specialty: "Orthopedics",
    role: "Orthopedic Specialist",
    gender: "Male",
    availability: "Today",
    rating: 4.7,
    experience: "10 years",
    image: "https://i.pravatar.cc/150?u=4",
    featured: false,
    experienceData: [
      { title: "Sports Medicine Director", institution: "Orthopedic Center", duration: "2014 - Present" }
    ],
    educationData: [
      { degree: "M.D. in Orthopedics", university: "Yale School of Medicine", year: "2014" }
    ],
    reviews: [
      { patientName: "Lisa M.", rating: 4, comment: "Helped me recover from a knee injury quickly.", date: "March 15, 2026" }
    ]
  }
];
