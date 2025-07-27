"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface FormData {
  email: string;
  message: string;
}

interface FormErrors {
  email?: string;
  message?: string;
}

export function ContactForm() {
  const [formData, setFormData] = useState<FormData>({
    email: "",
    message: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.message.trim()) {
      newErrors.message = "Message is required";
    } else if (formData.message.trim().length < 10) {
      newErrors.message = "Message must be at least 10 characters long";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitStatus("success");
        setFormData({
          email: "",
          message: "",
        });
      } else {
        setSubmitStatus("error");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="text-left">
          <label htmlFor="email" className="block text-sm font-medium mb-2 text-left">
            Email
          </label>
          <Input
            id="email"
            type="email"
            name="email"
            placeholder="example-email@gmail.com"
            value={formData.email}
            onChange={handleInputChange}
            className={`text-left ${errors.email ? "border-red-500" : ""}`}
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1 text-left">{errors.email}</p>
          )}
        </div>

        <div className="text-left">
          <label htmlFor="message" className="block text-sm font-medium mb-2 text-left">
            Message
          </label>
          <Textarea
            id="message"
            name="message"
            placeholder="Hi! I really like your work and want to discuss some things...."
            value={formData.message}
            onChange={handleInputChange}
            className={`min-h-[120px] resize-none text-left ${errors.message ? "border-red-500" : ""}`}
          />
          {errors.message && (
            <p className="text-red-500 text-sm mt-1 text-left">{errors.message}</p>
          )}
        </div>

        <div className="text-left">
          <p className="text-base text-muted-foreground mb-4 text-left">
            Ask me anything you would like. I always respond :D
          </p>

          <div className="text-center">
            <Button
              type="submit"
              className="bg-black text-white hover:bg-gray-800 px-8 py-2 rounded-md"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Sending..." : "Submit"}
            </Button>
          </div>

          {submitStatus === "success" && (
            <p className="text-green-600 text-sm mt-4 text-center">
              Message sent successfully! I'll get back to you soon.
            </p>
          )}

          {submitStatus === "error" && (
            <p className="text-red-500 text-sm mt-4 text-center">
              Failed to send message. Please try again or contact me directly.
            </p>
          )}
        </div>
      </form>
    </div>
  );
} 