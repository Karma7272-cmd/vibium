
import React from 'react';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import AppSidebar from '../components/AppSidebar';
import Footer from '../components/Footer';
import { Globe, Users, Shield, Zap, CheckCircle, Monitor } from 'lucide-react';

const About: React.FC = () => {
  return (
    <div className="min-h-screen flex w-full bg-background dark:sunrise-gradient">
      <AppSidebar 
        activeSection="" 
        onSectionChange={() => {}} 
      />
      <SidebarInset className="flex-1 flex flex-col">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-2 sm:px-4 bg-background/80 dark:bg-background/20 backdrop-blur-sm">
          <SidebarTrigger className="-ml-1" />
          <div className="ml-auto">
            <h1 className="text-lg sm:text-xl font-semibold text-foreground">About nuvic ai</h1>
          </div>
        </header>
        
        <div className="flex-1 overflow-auto bg-gray-50 dark:bg-transparent">
          <div className="max-w-4xl mx-auto p-6 sm:p-8">
            {/* Hero Section */}
            <div className="text-center mb-12">
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-foreground mb-6">
                Welcome to nuvic ai
              </h1>
              <p className="text-xl text-gray-600 dark:text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                A decentralized global testing network that puts the power of website monitoring 
                and performance testing in the hands of everyday users around the world.
              </p>
            </div>

            {/* What is Valet Network */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-foreground mb-6">What is nuvic ai?</h2>
              <div className="prose prose-lg max-w-none text-gray-700 dark:text-muted-foreground">
                <p className="mb-4">
                  nuvic ai is a new approach to website testing and monitoring. Instead of 
                  relying on centralized servers in data centers, we harness the collective power of real 
                  devices operated by real people across the globe.
                </p>
                <p className="mb-4">
                  Think of it as an Uber for website testing - anyone can become a "node operator" by 
                  running our software on their device, contributing to a global network that provides 
                  authentic, real-world testing conditions for websites and applications.
                </p>
              </div>
            </div>

            {/* How it Works */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-foreground mb-8">How It Works</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-card/40 dark:backdrop-blur-sm p-6 rounded-lg border border-gray-200 dark:border-border shadow-sm">
                  <Users className="w-8 h-8 text-primary dark:text-primary mb-4" />
                  <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-foreground">Join the Network</h3>
                  <p className="text-gray-600 dark:text-muted-foreground">
                    Anyone can become a node operator by installing our software and contributing 
                    their device to the global testing network.
                  </p>
                </div>
                
                <div className="bg-white dark:bg-card/40 dark:backdrop-blur-sm p-6 rounded-lg border border-gray-200 dark:border-border shadow-sm">
                  <CheckCircle className="w-8 h-8 text-primary dark:text-primary mb-4" />
                  <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-foreground">Run Tests</h3>
                  <p className="text-gray-600 dark:text-muted-foreground">
                    Developers and businesses submit websites to be tested across our 
                    distributed network of real devices and connections.
                  </p>
                </div>
                
                <div className="bg-white dark:bg-card/40 dark:backdrop-blur-sm p-6 rounded-lg border border-gray-200 dark:border-border shadow-sm">
                  <Globe className="w-8 h-8 text-accent dark:text-accent mb-4" />
                  <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-foreground">Global Insights</h3>
                  <p className="text-gray-600 dark:text-muted-foreground">
                    Get authentic performance data from real users, real devices, and 
                    real network conditions around the world.
                  </p>
                </div>
              </div>
            </div>

            {/* Why Valet Network */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-foreground mb-8">Why nuvic ai?</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <Shield className="w-6 h-6 text-primary dark:text-primary mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-foreground">Authentic Testing</h3>
                      <p className="text-gray-600 dark:text-muted-foreground">
                        Test on real devices with real network conditions, not simulated environments.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <Zap className="w-6 h-6 text-accent dark:text-accent mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-foreground">Decentralized Power</h3>
                      <p className="text-gray-600 dark:text-muted-foreground">
                        No single point of failure - our network grows stronger with every participant.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <Globe className="w-6 h-6 text-primary dark:text-primary mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-foreground">Global Reach</h3>
                      <p className="text-gray-600 dark:text-muted-foreground">
                        Access testing capabilities from anywhere in the world, instantly.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <Monitor className="w-6 h-6 text-accent dark:text-accent mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-foreground">Earn While You Help</h3>
                      <p className="text-gray-600 dark:text-muted-foreground">
                        Node operators earn rewards for contributing their devices to the network.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* From the Creator of Selenium */}
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-foreground mb-6">From the Creator of Selenium</h2>
              <div className="prose prose-lg max-w-none text-gray-700 dark:text-muted-foreground">
                <p className="mb-4">
                  nuvic ai is a new project from Jason Huggins, who started the Selenium and Appium 
                  projects and co-founded Sauce Labs—tools that helped shape modern test automation. 
                  He has spent the past decade building real-device testing robots at Tapster, and was part 
                  of the White House tech surge that rescued HealthCare.gov for President Obama. 
                  With nuvic ai, he's rethinking test infrastructure from the ground up—decentralized, 
                  user-powered, and built for the next web.
                </p>
              </div>
            </div>

            {/* Call to Action */}
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-foreground mb-6">Ready to Join?</h2>
              <p className="text-xl text-gray-600 dark:text-muted-foreground mb-8 max-w-2xl mx-auto">
                Whether you want to test your website or contribute to the network by running a node, 
                getting started is easy.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="bg-primary hover:bg-primary/90 dark:bg-primary dark:hover:bg-primary/90 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
                  Check a Website
                </button>
                <button className="bg-gray-200 hover:bg-gray-300 dark:bg-muted dark:hover:bg-muted/80 text-gray-900 dark:text-foreground px-8 py-3 rounded-lg font-semibold transition-colors">
                  Run a Node
                </button>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </SidebarInset>
    </div>
  );
};

export default About;
