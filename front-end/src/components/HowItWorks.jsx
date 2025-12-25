import { FaCheckCircle, FaPhone, FaUserPlus, FaVideo } from 'react-icons/fa'

function HowItWorks() {
  const steps = [
    {
      icon: <FaUserPlus className="text-5xl" />,
      title: "1. Create Your Account",
      description: "Sign up with your email and create a secure password. It takes less than a minute!"
    },
    {
      icon: <FaPhone className="text-5xl" />,
      title: "2. Login to Dashboard",
      description: "Access your personal dashboard where you can start making calls instantly"
    },
    {
      icon: <FaVideo className="text-5xl" />,
      title: "3. Start Video Calling",
      description: "Click to call and the other user will get notified. Accept the call and start connecting!"
    },
    {
      icon: <FaCheckCircle className="text-5xl" />,
      title: "4. Enjoy Secure Calls",
      description: "All your calls are encrypted end-to-end. Only you and the other person can see and hear the conversation"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-beige/50">
      
      {/* Header */}
      <section className="bg-royal-blue text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-extrabold mb-6 fade-in">
            How It Works
          </h1>
          <p className="text-xl text-beige max-w-3xl mx-auto">
            Getting started with SecureCall is simple. Follow these easy steps to start making secure video calls.
          </p>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-16">
            
            {steps.map((step, index) => (
              <div 
                key={index}
                className={`flex flex-col md:flex-row items-center gap-8 ${
                  index % 2 === 1 ? 'md:flex-row-reverse' : ''
                }`}
              >
                {/* Icon */}
                <div className="flex-shrink-0">
                  <div className="bg-royal-blue text-white p-8 rounded-full shadow-xl">
                    {step.icon}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    {step.title}
                  </h2>
                  <p className="text-lg text-gray-600">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}

          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="bg-beige py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            🔒 Your Privacy is Our Priority
          </h2>
          <p className="text-lg text-gray-700 mb-8">
            All video calls are protected with end-to-end encryption using WebRTC's built-in DTLS-SRTP security. 
            This means your conversations are completely private - not even we can access them.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="font-semibold text-gray-900 mb-2">No Data Collection</h3>
              <p className="text-sm text-gray-600">We don't record or store your video calls</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="font-semibold text-gray-900 mb-2">Peer-to-Peer</h3>
              <p className="text-sm text-gray-600">Direct connection between users for maximum privacy</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="font-semibold text-gray-900 mb-2">Military-Grade</h3>
              <p className="text-sm text-gray-600">Industry-standard encryption protocols</p>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}

export default HowItWorks
