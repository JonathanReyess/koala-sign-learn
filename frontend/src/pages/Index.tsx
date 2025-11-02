import { useState } from "react";
import { Hero } from "@/components/Hero";
import { LearningCard } from "@/components/LearningCard";

// Sample words for demo (can be replaced with actual word list later)
const words = ["3", "13", "38", "7", "62"];

const Index = () => {
  const [isLearning, setIsLearning] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  const handleStartLearning = () => {
    setIsLearning(true);
  };

  const handleNext = () => {
    setCurrentWordIndex((prev) => (prev + 1) % words.length);
  };

  if (!isLearning) {
    return <Hero onStartLearning={handleStartLearning} />;
  }

  return (
    <LearningCard 
      word={words[currentWordIndex]} 
      onNext={handleNext}
    />
  );
};

export default Index;
