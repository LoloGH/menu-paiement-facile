
import { Facebook, Instagram, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";

export const SocialMediaButtons = () => {
  return (
    <div className="flex space-x-2">
      <Button 
        variant="outline" 
        size="icon" 
        className="rounded-full bg-white hover:bg-gray-100"
        onClick={() => window.open('https://facebook.com', '_blank')}
      >
        <Facebook className="h-5 w-5 text-blue-600" />
        <span className="sr-only">Facebook</span>
      </Button>
      <Button 
        variant="outline" 
        size="icon" 
        className="rounded-full bg-white hover:bg-gray-100"
        onClick={() => window.open('https://instagram.com', '_blank')}
      >
        <Instagram className="h-5 w-5 text-pink-600" />
        <span className="sr-only">Instagram</span>
      </Button>
      <Button 
        variant="outline" 
        size="icon" 
        className="rounded-full bg-white hover:bg-gray-100"
        onClick={() => window.open('https://twitter.com', '_blank')}
      >
        <Twitter className="h-5 w-5 text-blue-400" />
        <span className="sr-only">X (Twitter)</span>
      </Button>
    </div>
  );
};
