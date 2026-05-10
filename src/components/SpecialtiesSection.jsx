import React, { useEffect, useRef } from 'react';
import {
  HeartPulse,
  Stethoscope,
  Brain,
  Bone,
  Eye,
  Baby,
  Microscope,
  Dna
} from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SpecialtyCard from './SpecialtyCard';

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

const specialtiesData = [
  {
    title: "أمراض القلب",
    description: "رعاية قلبية متخصصة تشمل التشخيص والعلاج والإدارة طويلة المدى لصحة القلب والأوعية الدموية.",
    icon: HeartPulse,
    color: "red"
  },
  {
    title: "طب الأعصاب",
    description: "علاج متخصص لاضطرابات الدماغ والعمود الفقري والجهاز العصبي باستخدام تكنولوجيا متقدمة.",
    icon: Brain,
    color: "purple"
  },
  {
    title: "طب الأطفال",
    description: "رعاية صحية حانية للرضع والأطفال والمراهقين في بيئة صديقة للطفل.",
    icon: Baby,
    color: "green"
  },
  {
    title: "جراحة العظام",
    description: "رعاية شاملة للعظام والمفاصل والجهاز العضلي لاستعادة القدرة على الحركة والقوة.",
    icon: Bone,
    color: "orange"
  },
  {
    title: "طب العيون",
    description: "مجموعة كاملة من خدمات العناية بالعيون من الفحوصات الروتينية إلى العمليات الجراحية المعقدة.",
    icon: Eye,
    color: "cyan"
  },
  {
    title: "الجراحة العامة",
    description: "عمليات جراحية حديثة مع التركيز على التقنيات الأقل توغلاً والتعافي السريع.",
    icon: Stethoscope,
    color: "blue"
  },
  {
    title: "التشخيص",
    description: "خدمات مختبرية وتصويرية حديثة لتشخيص طبي دقيق وفي الوقت المناسب.",
    icon: Microscope,
    color: "blue"
  },
  {
    title: "علم الوراثة",
    description: "اختبارات واستشارات وراثية متقدمة لفهم وإدارة المخاطر الصحية الوراثية.",
    icon: Dna,
    color: "purple"
  }
];

const SpecialtiesSection = () => {
  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const cardsRef = useRef([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Header animation
      gsap.from(headerRef.current, {
        opacity: 0,
        y: 30,
        duration: 0.8,
        scrollTrigger: {
          trigger: headerRef.current,
          start: "top 85%",
        }
      });

      // Cards stagger animation
      gsap.from(".specialty-card", {
        opacity: 0,
        y: 40,
        stagger: 0.15,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ".specialties-grid",
          start: "top 80%",
        }
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="py-20 bg-gray-50/50 overflow-hidden"
    >
      <div className="container mx-auto px-4 md:px-8">
        {/* Header Section */}
        <div ref={headerRef} className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-blue-900 mb-6">
            تخصصاتنا
          </h2>
          <p className="text-lg text-gray-500 leading-relaxed">
            نقدم مجموعة واسعة من الخدمات الطبية التي يقدمها أخصائيون عالميون باستخدام أحدث وسائل التكنولوجيا والتقنيات الطبية.
          </p>
        </div>

        {/* Grid Layout */}
        <div className="specialties-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {specialtiesData.map((specialty, index) => (
            <SpecialtyCard
              key={index}
              {...specialty}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default SpecialtiesSection;
