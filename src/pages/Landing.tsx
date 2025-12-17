import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  MessageSquare,
  Plus,
  Mail,
  Calendar,
  MoreHorizontal,
  Bot,
  BarChart3,
  Phone,
  Search,
  Check
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";

const Landing = () => {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-indigo-100">
      {/* Background Dot Pattern */}
      <div className="fixed inset-0 h-full w-full bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none -z-10"></div>

      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 rounded-full border-2 border-white"></div>
            </div>
            <span className="text-2xl font-bold text-slate-900 tracking-tight">Nucleus</span>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center bg-gray-50/80 px-2 py-1.5 rounded-full border border-gray-100 shadow-sm">
            {['Home', 'Features', 'Solutions', 'Resources', 'Pricing'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className={`px-5 py-2 text-sm font-medium rounded-full transition-all ${item === 'Home'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-indigo-600'
                  }`}
              >
                {item}
              </a>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <Link to="/auth">
              <Button variant="ghost" className="font-semibold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50">
                Log In
              </Button>
            </Link>
            <Link to="/signup">
              <Button className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-semibold rounded-xl px-6 py-5 shadow-lg shadow-indigo-200 transition-all hover:shadow-indigo-300 hover:scale-[1.02]">
                Schedule A Demo
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="pt-32 pb-20 overflow-hidden text-center">
        <div className="container mx-auto px-4 relative z-10">

          {/* Badge */}
          <div className="inline-flex items-center justify-center mb-8">
            <div className="px-5 py-2 rounded-full border border-indigo-100 bg-white/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all cursor-default">
              <span className="bg-gradient-to-r from-indigo-600 to-indigo-500 bg-clip-text text-transparent font-semibold text-sm">
                Instant Crm Ai Tools
              </span>
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight text-slate-900 leading-[1.1]">
            Every Customer Insights,
            <br />
            <span className="bg-gradient-to-r from-indigo-500 via-indigo-500 to-indigo-600 bg-clip-text text-transparent pb-2">
              Intelligently Handled
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed font-medium">
            Give your team the clarity, context, and speed they need to deliver
            extraordinary experiences — at every touchpoint
          </p>

          {/* CTA */}
          <div className="flex justify-center mb-24">
            <Link to="/signup">
              <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white h-14 px-10 text-lg rounded-xl shadow-xl shadow-indigo-200 transition-all hover:scale-105 font-semibold">
                Get Started
              </Button>
            </Link>
          </div>

          {/* Interactive Flow Visual */}
          <div className="relative mx-auto max-w-6xl h-[600px] hidden md:block select-none text-left">
            {/* Connecting Lines (SVG overlay) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
              <path d="M300,180 C300,250 500,250 500,320" fill="none" stroke="#e2e8f0" strokeWidth="2" strokeDasharray="6 6" />
              <path d="M850,230 C850,280 650,280 650,320" fill="none" stroke="#e2e8f0" strokeWidth="2" strokeDasharray="6 6" />
              <path d="M300,380 C300,450 400,450 400,500" fill="none" stroke="#e2e8f0" strokeWidth="2" strokeDasharray="6 6" />
              <path d="M850,380 C850,450 750,450 750,480" fill="none" stroke="#e2e8f0" strokeWidth="2" strokeDasharray="6 6" />
            </svg>

            {/* Card 1: Schedule */}
            <div className="absolute top-20 left-20 z-10 animate-fade-in-up [animation-delay:200ms]">
              <div className="flex items-center gap-2 text-indigo-500 font-semibold mb-2 text-sm">
                <Calendar className="w-4 h-4" /> Schedule
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 w-64 hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-slate-800">Shortcall Demo</h4>
                </div>
                <div className="text-xs text-slate-400 mb-4">May 12, 14.30 - 15.30 PM</div>
                <Button size="sm" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg h-9 text-xs font-semibold gap-2">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                  meet/sdk-889-000
                </Button>
              </div>
            </div>

            {/* Card 2: Sales Outreach */}
            <div className="absolute top-24 right-20 z-10 animate-fade-in-up [animation-delay:400ms]">
              <div className="flex items-center gap-2 text-indigo-500 font-semibold mb-2 text-sm">
                <BarChart3 className="w-4 h-4" /> Sales Outreach
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 w-80 relative group hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-indigo-100 p-2 rounded-lg">
                    <Phone className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">Step 2 Phone Call Attempt</h4>
                  </div>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex gap-1">
                  <div className="h-full w-1/3 bg-indigo-600 rounded-full"></div>
                  <div className="h-full w-1/4 bg-slate-200 rounded-full"></div>
                  <div className="h-full w-1/4 bg-slate-200 rounded-full"></div>
                </div>
                {/* Simulated Cursor */}
                <div className="absolute -bottom-4 -right-4 flex flex-col items-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="drop-shadow-lg transform translate-y-1">
                    <path d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19179L17.9036 8.97152L10.374 8.97152C10.05 8.97152 9.76159 9.14151 9.61042 9.42173L5.65376 12.3673Z" fill="black" />
                  </svg>
                  <div className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap">
                    AI Assistant
                  </div>
                </div>
              </div>
            </div>

            {/* Center Main Card: Profile */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 animate-fade-in-up [animation-delay:0ms]">
              <div className="bg-white rounded-3xl p-6 shadow-[0_20px_50px_rgb(0,0,0,0.1)] border border-indigo-100 w-[420px]">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <img
                      src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80"
                      alt="User"
                      className="w-12 h-12 rounded-full border-2 border-white shadow-sm object-cover"
                    />
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Lucas Graham</h3>
                      <p className="text-sm text-slate-400">Head of IT Everafter.io</p>
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" className="text-slate-300">
                    <MoreHorizontal className="w-5 h-5" />
                  </Button>
                </div>
                <div className="flex gap-2 mb-6">
                  <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-10 shadow-lg shadow-indigo-200">
                    <Mail className="w-4 h-4 mr-2" /> Compose Email
                  </Button>
                  <Button variant="outline" size="icon" className="rounded-xl border-slate-200">
                    <Calendar className="w-4 h-4 text-slate-500" />
                  </Button>
                  <Button variant="outline" size="icon" className="rounded-xl border-slate-200">
                    <Plus className="w-4 h-4 text-slate-500" />
                  </Button>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Summary</span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Lucas Graham, the head of IT Everafter.io planning to be increase their team efficiency through modern...
                  </p>
                </div>
              </div>
            </div>

            {/* Card 3: Company */}
            <div className="absolute bottom-20 left-48 z-10 animate-fade-in-up [animation-delay:600ms]">
              <div className="flex items-center gap-2 text-indigo-500 font-semibold mb-2 text-sm">
                <Bot className="w-4 h-4" /> Company
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 w-56 hover:shadow-lg transition-shadow relative">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">N</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-slate-800">Everafter.io</h4>
                      <Link to="#" className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 hover:bg-indigo-200">
                        <ArrowRight className="w-3 h-3 -rotate-45" />
                      </Link>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Venezia, Italy</p>
                  </div>
                </div>
                {/* Simulated Cursor */}
                <div className="absolute -bottom-6 -right-8 flex flex-col items-center z-50">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="drop-shadow-lg transform translate-y-1">
                    <path d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19179L17.9036 8.97152L10.374 8.97152C10.05 8.97152 9.76159 9.14151 9.61042 9.42173L5.65376 12.3673Z" fill="black" />
                  </svg>
                  <div className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap">
                    AI Assistant
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4: Activity */}
            <div className="absolute bottom-24 right-40 z-10 animate-fade-in-up [animation-delay:800ms]">
              <div className="flex items-center gap-2 text-indigo-500 font-semibold mb-2 text-sm">
                <Search className="w-4 h-4" /> Activity
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 w-72 hover:shadow-lg transition-shadow">
                <div className="space-y-4">
                  <div className="flex gap-3 relative">
                    <div className="absolute left-[11px] top-6 w-0.5 h-6 bg-slate-100"></div>
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0 z-10">
                      <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                    </div>
                    <div className="text-sm">
                      <p className="font-medium text-slate-800"><span className="font-bold">Andrew</span> Reaching out lucas</p>
                      <p className="text-xs text-slate-400">Yesterday, 11.30am</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 z-10">
                      <Calendar className="w-3 h-3 text-indigo-600" />
                    </div>
                    <div className="text-sm">
                      <p className="font-medium text-slate-800"><span className="font-bold">Billy</span> Scheduling meeting</p>
                      <p className="text-xs text-slate-400">Today, 09.20am</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* AI Workforce Section */}
      <section className="py-24 bg-white border-y border-slate-100 overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row shadow-2xl rounded-3xl overflow-hidden border border-slate-100">
            {/* Left Content */}
            <div className="w-full md:w-1/2 p-12 md:p-20 bg-white flex flex-col justify-center">
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-8 leading-tight">
                The AI Workforce humans can lean on.
              </h2>
              <p className="text-xl text-slate-500 mb-12 leading-relaxed">
                Never quits, and always improves. Scale to meet any demand.
              </p>
              <Link to="#" className="text-lg font-semibold flex items-center gap-2 hover:gap-4 transition-all group">
                More about Nucleus
                <ArrowRight className="w-5 h-5 text-indigo-600 group-hover:text-indigo-700" />
              </Link>
            </div>
            {/* Right Visual */}
            <div className="w-full md:w-1/2 bg-indigo-600 relative min-h-[400px]">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-indigo-700 opacity-90"></div>
              {/* Background Text Overlay */}
              <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                <span className="text-[20rem] font-bold text-white opacity-10 select-none">AI</span>
              </div>
              <img
                src="https://images.unsplash.com/photo-1573497620053-ea5300f94f21?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                alt="AI Workforce"
                className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-80 md:opacity-100"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-slate-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 shadow-sm text-sm font-medium text-slate-600 mb-6">
              <div className="w-2 h-2 rounded-full bg-indigo-500"></div> Pricing
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              5M+ users and still counting
            </h2>
            <p className="text-lg text-slate-500 mb-10">
              Start free and upgrade anytime as your team and projects grow
            </p>

            {/* Toggle */}
            <div className="flex items-center justify-center gap-4 text-sm font-medium">
              <span className={!isAnnual ? "text-slate-900" : "text-slate-500"}>Monthly</span>
              <Switch checked={isAnnual} onCheckedChange={setIsAnnual} />
              <span className={isAnnual ? "text-slate-900" : "text-slate-500"}>Annual</span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {/* Starter */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-xl transition-all">
              <h3 className="font-bold text-lg mb-2">Starter</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold tracking-tight">$0</span>
                <span className="text-slate-500 text-sm">/ {isAnnual ? "year" : "month"}</span>
              </div>
              <p className="text-xs text-slate-500 mb-6 font-medium uppercase tracking-wide">For personal</p>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2 text-sm text-slate-600">
                  <Check className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" /> 2 User Seat Only
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-600">
                  <Check className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" /> Basic Activity Feed
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-600">
                  <Check className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" /> AI Smart Summary
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-600">
                  <Check className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" /> Basic Email Tracking
                </li>
              </ul>
              <Button variant="outline" className="w-full rounded-xl h-11 border-slate-200">Free Access</Button>
            </div>

            {/* Growth */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-xl transition-all">
              <h3 className="font-bold text-lg mb-2">Growth</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold tracking-tight">${isAnnual ? "29" : "35"}</span>
                <span className="text-slate-500 text-sm">/ {isAnnual ? "year" : "month"}</span>
              </div>
              <p className="text-xs text-slate-500 mb-6 font-medium uppercase tracking-wide">For growing teams</p>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2 text-sm text-slate-600">
                  <Check className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" /> Up To 10 Users
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-600">
                  <Check className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" /> Smart Summary + Score
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-600">
                  <Check className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" /> Touchpoint Reminder
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-600">
                  <Check className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" /> Outreach Sequence
                </li>
              </ul>
              <Button variant="outline" className="w-full rounded-xl h-11 border-slate-200">Get Started</Button>
            </div>

            {/* Pro - Highlighted */}
            <div className="bg-white rounded-2xl p-6 border-2 border-indigo-500 shadow-2xl shadow-indigo-200/50 relative transform md:-translate-y-4">
              <div className="absolute top-0 left-0 w-full h-8 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider flex items-center justify-center rounded-t-lg -mt-[2px]">
                Users best choice !
              </div>
              <h3 className="font-bold text-lg mb-2 mt-6">Pro</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold tracking-tight">${isAnnual ? "45" : "55"}</span>
                <span className="text-slate-500 text-sm">/ {isAnnual ? "year" : "month"}</span>
              </div>
              <p className="text-xs text-slate-500 mb-6 font-medium uppercase tracking-wide">For multi-user teams</p>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2 text-sm text-slate-600">
                  <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" /> Unlimited Users
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-600">
                  <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" /> Clara Snapshot
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-600">
                  <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" /> AI Suggestion Engine
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-600">
                  <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" /> Advanced Scheduling
                </li>
              </ul>
              <Button className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl h-11 hover:from-indigo-600 hover:to-indigo-700 shadow-lg shadow-indigo-200">Get Started</Button>
            </div>

            {/* Enterprise */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-xl transition-all">
              <h3 className="font-bold text-lg mb-2">Enterprise</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold tracking-tight text-indigo-500">Custom</span>
                <span className="text-slate-500 text-sm block">More flexible</span>
              </div>
              <p className="text-xs text-slate-500 mb-6 font-medium uppercase tracking-wide">For large teams</p>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2 text-sm text-slate-600">
                  <Check className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" /> Fields & Data Model
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-600">
                  <Check className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" /> Various Integrations
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-600">
                  <Check className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" /> Custom Insight AI
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-600">
                  <Check className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" /> SLA, Onboarding
                </li>
              </ul>
              <Button variant="outline" className="w-full rounded-xl h-11 border-slate-200">Talk to sales</Button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6 flex flex-col lg:flex-row gap-16">
          <div className="lg:w-1/3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 shadow-sm text-sm font-medium text-slate-600 mb-6">
              <MessageSquare className="w-3 h-3 text-indigo-500" /> FAQ
            </div>
            <h2 className="text-4xl font-bold text-slate-900 mb-6">
              Everything You're Wondering, Answered.
            </h2>
            <p className="text-slate-500 mb-4">
              Couldn't Find Something ? <a href="#" className="text-indigo-600 font-semibold hover:underline">Message Us</a>
            </p>
          </div>
          <div className="lg:w-2/3">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-lg font-semibold text-slate-800">How is Nucleus different from other CRMs?</AccordionTrigger>
                <AccordionContent className="text-slate-600 text-base leading-relaxed">
                  Nucleus doesn't just store data—it understands it. From summarizing customer interactions to suggesting next steps, Nucleus is like a co-pilot that helps you move faster with more confidence.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger className="text-lg font-semibold text-slate-800">Can Nucleus help my team save time?</AccordionTrigger>
                <AccordionContent className="text-slate-600 text-base leading-relaxed">
                  Absolutely. Nucleus automates routine tasks, schedules follow-ups, and provides instant summaries of meetings, allowing your team to focus on high-value interactions.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger className="text-lg font-semibold text-slate-800">Is Nucleus hard to set up?</AccordionTrigger>
                <AccordionContent className="text-slate-600 text-base leading-relaxed">
                  Not at all. We offer a seamless onboarding process, and our support team is available to help migrate your data and configure your workflows in just a few clicks.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger className="text-lg font-semibold text-slate-800">What tools does Nucleus integrate with?</AccordionTrigger>
                <AccordionContent className="text-slate-600 text-base leading-relaxed">
                  Nucleus integrates with popular tools like Google Workspace, Slack, Zoom, and various marketing automation platforms to keep your data synchronized across your stack.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      {/* CTA & Mega Footer Section */}
      <footer className="bg-gradient-to-br from-indigo-600 to-indigo-700 text-white pt-24 pb-8 overflow-hidden relative">
        {/* Decorative Arcs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[180%] h-[1000px] bg-white/5 rounded-[100%] blur-3xl pointer-events-none -translate-y-1/2"></div>

        {/* CTA Content */}
        <div className="container mx-auto px-6 text-center relative z-10 mb-20">
          <div className="flex justify-center mb-6">
            <div className="w-6 h-6 rotate-45 bg-white shadow-[0_0_20px_rgba(255,255,255,0.5)]"></div>
          </div>
          <h2 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight">
            Know More, Act Faster And <br /> Close Smarter.
          </h2>
          <p className="text-xl text-indigo-100 mb-10">
            AI-powered clarity for every stage of your customer journey
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-white text-indigo-900 border-none hover:bg-slate-100 font-bold h-12 px-8 rounded-lg shadow-lg">
              Get Started
            </Button>
            <Button variant="outline" className="bg-slate-900/30 text-white border-white/20 hover:bg-slate-900/50 font-bold h-12 px-8 rounded-lg">
              Schedule A Demo
            </Button>
          </div>
        </div>

        {/* White Footer Card */}
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-3xl p-12 text-slate-900 shadow-2xl">
            <div className="grid md:grid-cols-4 gap-12 mb-16">
              {/* Brand */}
              <div className="col-span-1 md:col-span-1">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full border-2 border-white"></div>
                  </div>
                  <span className="text-2xl font-bold text-slate-900 tracking-tight">Nucleus</span>
                </div>
                <h3 className="text-3xl font-bold text-slate-400 leading-tight">
                  Every Customer Insights, <span className="text-slate-900">Intelligently Handled</span>
                </h3>
              </div>

              {/* Links */}
              <div>
                <h4 className="font-bold mb-6">Features</h4>
                <ul className="space-y-4 text-slate-500">
                  <li><a href="#" className="hover:text-indigo-600">Nucleus feed</a></li>
                  <li><a href="#" className="hover:text-indigo-600">Smart summary</a></li>
                  <li><a href="#" className="hover:text-indigo-600">Pulse Score</a></li>
                  <li><a href="#" className="hover:text-indigo-600">Touchpoint Reminder</a></li>
                  <li><a href="#" className="hover:text-indigo-600">Nucleus Snapshot</a></li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold mb-6">Company</h4>
                <ul className="space-y-4 text-slate-500">
                  <li><a href="#" className="hover:text-indigo-600">About us</a></li>
                  <li><a href="#" className="hover:text-indigo-600">Careers</a></li>
                  <li><a href="#" className="hover:text-indigo-600">Contact Us</a></li>
                  <li><a href="#" className="hover:text-indigo-600">Feature</a></li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold mb-6">Stay in touch</h4>
                <ul className="space-y-4 text-slate-500">
                  <li><a href="#" className="hover:text-indigo-600">Instagram</a></li>
                  <li><a href="#" className="hover:text-indigo-600">Facebook</a></li>
                  <li><a href="#" className="hover:text-indigo-600">Twitter</a></li>
                  <li><a href="#" className="hover:text-indigo-600">Youtube</a></li>
                </ul>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center text-sm text-slate-400">
              <p>Copyright 2025, All right reserved by Nucleus</p>
              <div className="flex gap-6">
                <a href="#" className="hover:text-indigo-600">Privacy policy</a>
                <a href="#" className="hover:text-indigo-600">Terms and condition</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;