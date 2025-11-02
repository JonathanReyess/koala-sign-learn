import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface HeroProps {
  onStartLearning: () => void;
}

export const Hero = ({ onStartLearning }: HeroProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-6xl md:text-7xl font-bold tracking-tight">
            Learn Korean Sign Language
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            Master Korean Sign Language through interactive video lessons powered by machine learning
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button 
            size="lg" 
            onClick={onStartLearning}
            className="text-lg px-8 py-6 bg-primary hover:bg-primary/90 transition-all duration-300 hover:scale-105"
          >
            Start Learning Free
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>

        <div className="pt-12 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
          <div className="space-y-2">
            <div className="text-3xl font-bold text-primary">100%</div>
            <div className="text-sm text-muted-foreground">Free Forever</div>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-primary">AI</div>
            <div className="text-sm text-muted-foreground">Powered Learning</div>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-primary">Smart</div>
            <div className="text-sm text-muted-foreground">Spaced Repetition</div>
          </div>
        </div>
      </div>
    </div>
  );
};
