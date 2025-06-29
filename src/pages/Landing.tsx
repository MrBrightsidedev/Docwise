import React from 'react';
import HeroSection from '../components/HeroSection';
import FeatureCard from '../components/FeatureCard';
import { Clock, Users, Globe, Shield } from 'lucide-react';

const Landing: React.FC = () => {
  return (
    <div className="min-h-screen">
      <HeroSection />
      
      {/* Additional Features Section */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose Docwise?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built for modern businesses that need reliable, fast, and professional legal document generation.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={Clock}
              title="Save Time"
              description="Generate documents in minutes, not hours. Focus on your business while we handle the paperwork."
            />
            <FeatureCard
              icon={Shield}
              title="Secure & Private"
              description="Your data is encrypted and secure. We never share your information with third parties."
            />
            <FeatureCard
              icon={Users}
              title="Team Collaboration"
              description="Share documents with your team and collaborate in real-time on important agreements."
            />
            <FeatureCard
              icon={Globe}
              title="Global Compliance"
              description="Documents generated with international legal standards and best practices in mind."
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <img src="/Docwise logo.png" alt="Docwise" className="h-8 w-8" />
                <span className="text-xl font-semibold">Docwise</span>
              </div>
              <p className="text-gray-400">
                AI-powered legal document generation for modern businesses.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Templates</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Docwise. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;