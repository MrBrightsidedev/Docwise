import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, FileText, Zap, Shield } from 'lucide-react';

const HeroSection: React.FC = () => {
  return (
    <div className="bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Generate AI-Powered
            <br />
            <span className="text-primary-600">Legal Documents</span>
            <br />
            in Minutes
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Create professional NDAs, contracts, and agreements with AI assistance. 
            Save time, reduce costs, and ensure legal compliance for your business.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link
              to="/signup"
              className="bg-primary-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-primary-700 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl"
            >
              <span>Try it for Free</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              to="/pricing"
              className="text-gray-700 px-8 py-4 rounded-xl text-lg font-semibold hover:text-gray-900 transition-colors border border-gray-300 hover:border-gray-400"
            >
              View Pricing
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="bg-primary-100 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-6">
              <Zap className="h-8 w-8 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Lightning Fast</h3>
            <p className="text-gray-600 leading-relaxed">
              Generate comprehensive legal documents in under 2 minutes using advanced AI technology.
            </p>
          </div>

          <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="bg-primary-100 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-6">
              <Shield className="h-8 w-8 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Legally Sound</h3>
            <p className="text-gray-600 leading-relaxed">
              AI-generated documents based on proven legal templates and current regulations.
            </p>
          </div>

          <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="bg-primary-100 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-6">
              <FileText className="h-8 w-8 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Export Anywhere</h3>
            <p className="text-gray-600 leading-relaxed">
              Export to PDF, Google Docs, or Word format. Seamless integration with your workflow.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;