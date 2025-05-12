"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { Github, Globe } from "lucide-react";

export function AboutDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" className="text-sm font-medium transition-colors hover:text-primary">
          About
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl text-center">About the Creator</DialogTitle>
        </DialogHeader>
        <div className="py-4 flex flex-col items-center gap-6">
          <div className="flex-shrink-0">
            <Image
              src="/profile.png"
              alt="Jesse Hines"
              width={120}
              height={120}
              className="rounded-full border-2 border-primary/20"
              priority
            />
          </div>
          <div className="flex-1 space-y-4 text-center">
            <h3 className="text-lg font-semibold">Jesse Hines</h3>
            <p className="text-sm text-muted-foreground">
              I'm a mathematics student at the University of Waterloo with a passion for building 
              software that solves real problems. WatPlan was created to simplify the complex process 
              of degree planning for UWaterloo students.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link 
                href="https://github.com/JamesticCS" 
                target="_blank" 
                className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md bg-muted hover:bg-muted/80 transition-colors"
              >
                <Github className="mr-2 h-4 w-4" />
                GitHub
              </Link>
              <Link 
                href="https://jessehines.ca" 
                target="_blank"
                className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-md bg-muted hover:bg-muted/80 transition-colors"
              >
                <Globe className="mr-2 h-4 w-4" />
                Personal Website
              </Link>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}