import { useState } from "react";
import { LearningCard } from "@/components/LearningCard";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";

// Words list for iteration in Learn.tsx
export const words = [
  "hi", "what", "meat", "bi bim rice", "glad", "hobby", "me", "movie", "face",
  "see", "name", "read", "thank", "equal", "sorry", "eat", "fine", "do effort", "next",
  "age", "again", "how many", "day", "good, nice", "when", "we", "subway", "be friendly",
  "bus", "ride", "cell phone", "where", "number", "location", "guide", "responsibility",
  "who", "arrive", "family", "time", "introduction", "recieve", "please?", "walk",
  "parents", "10 minutes", "sister", "study", "human", "now", "special", "yesterday",
  "education", "test", "end", "you", "worried_about", "marry", "effort", "no", "yet",
  "finally", "born", "success", "favor", "Seoul", "dinner", "experience", "invite",
  "food", "want", "visit", "one hour", "far", "good", "care"
];

const Learn = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  // Start at a random index
  const [currentWordIndex, setCurrentWordIndex] = useState(
    Math.floor(Math.random() * words.length)
  );

  const handleNext = () =>
    setCurrentWordIndex((prev) => (prev + 1) % words.length);

  const handlePrevious = () =>
    setCurrentWordIndex((prev) => (prev - 1 + words.length) % words.length);

  return (
    <div className="relative min-h-screen flex flex-col bg-[hsl(var(--background))]">
      {/* Top-left logo */}
      <header className="absolute top-0 left-0 p-6 z-50">
        <img
          src="/koala.svg"
          alt="Koala Logo"
          style={{ width: isMobile ? "172px" : "250px", height: "auto" }}
          className="cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => navigate("/")}
        />
      </header>

      {/* Centered LearningCard */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-2xl">
          <LearningCard
            word={words[currentWordIndex]}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        </div>
      </main>
    </div>
  );
};

export default Learn;
