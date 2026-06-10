import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { ArrowLeft } from "lucide-react";

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <h1 className="font-display text-6xl font-bold text-text-primary mb-4">404</h1>
      <p className="text-lg text-text-secondary mb-6">Page not found</p>
      <Button asChild variant="default">
        <Link to="/">
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back to home
        </Link>
      </Button>
    </div>
  );
}
