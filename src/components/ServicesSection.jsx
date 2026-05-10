import React from 'react';
import {
  HeartPulse,
  Baby,
  Bone,
  Brain
} from 'lucide-react';
import ServiceCard from './ServiceCard';

const specialtiesData = [
  {
    title: "أمراض القلب",
    description: "رعاية قلبية متخصصة تشمل التشخيص والعلاج والإدارة طويلة المدى لصحة القلب والأوعية الدموية.",
    icon: HeartPulse,
    color: "blue"
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
    title: "طب الأعصاب",
    description: "علاج متخصص لاضطرابات الدماغ والعمود الفقري والجهاز العصبي باستخدام تكنولوجيا متقدمة.",
    icon: Brain,
    color: "indigo"
  }
];

const ServicesSection = () => {
  return (
    <section className="py-24 bg-[#f9fafb]">
      <div className="container mx-auto px-4 md:px-8 max-w-7xl">
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold text-[#111827] mb-6 tracking-tight">
            تخصصاتنا
          </h2>
          <p className="text-lg text-gray-500 leading-relaxed font-medium">
            نقدم مجموعة واسعة من الخدمات الطبية مع فريق من الأخصائيين المؤهلين تأهيلاً عالياً وأحدث وسائل التكنولوجيا.
          </p>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {specialtiesData.map((specialty, index) => (
            <ServiceCard
              key={index}
              {...specialty}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
