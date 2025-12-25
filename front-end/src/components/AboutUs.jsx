import { FaGlobe, FaHeart, FaShieldAlt } from 'react-icons/fa'

function AboutUs() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-beige/30 to-white">
      
      {/* Header */}
      <section className="bg-gradient-to-r from-royal-blue to-secondary text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-extrabold mb-6 fade-in">
            About SecureCall
          </h1>
          <p className="text-xl text-beige max-w-3xl mx-auto">
            Connecting people securely, one call at a time
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Our Mission
            </h2>
            <p className="text-xl text-gray-700 leading-relaxed">
              At SecureCall, we believe that everyone deserves access to secure, high-quality video communication. 
              Our mission is to provide a platform where privacy meets simplicity, enabling meaningful connections 
              without compromising security or accessibility.
            </p>
          </div>

          {/* Values */}
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            
            {/* Privacy */}
            <div className="text-center p-6">
              <div className="flex justify-center mb-4">
                <div className="bg-royal-blue text-white p-6 rounded-full">
                  <FaShieldAlt className="text-4xl" />
                </div>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">Privacy First</h3>
              <p className="text-gray-600">
                Your conversations are yours alone. We implement industry-leading encryption to ensure your privacy is protected at all times.
              </p>
            </div>

            {/* Accessibility */}
            <div className="text-center p-6">
              <div className="flex justify-center mb-4">
                <div className="bg-royal-blue text-white p-6 rounded-full">
                  <FaGlobe className="text-4xl" />
                </div>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">Global Access</h3>
              <p className="text-gray-600">
                No matter where you are in the world, SecureCall brings you closer to the people who matter most.
              </p>
            </div>

            {/* User-Centric */}
            <div className="text-center p-6">
              <div className="flex justify-center mb-4">
                <div className="bg-royal-blue text-white p-6 rounded-full">
                  <FaHeart className="text-4xl" />
                </div>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">User-Centric</h3>
              <p className="text-gray-600">
                We design every feature with you in mind, ensuring an intuitive experience that just works.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="bg-beige py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            Our Story
          </h2>
          <div className="space-y-4 text-lg text-gray-700">
            <p>
              SecureCall was born from a simple idea: video calling should be secure, free, and accessible to everyone. 
              In a world where privacy is increasingly important, we set out to create a platform that puts user security first.
            </p>
            <p>
              Built with cutting-edge technologies like WebRTC and end-to-end encryption, SecureCall ensures that your 
              personal conversations remain personal. We don't believe in compromising on security or charging for basic communication.
            </p>
            <p>
              Today, SecureCall serves users around the globe, facilitating thousands of secure video calls every day. 
              Whether you're connecting with family, friends, or colleagues, we're here to make sure your conversations 
              are private, clear, and reliable.
            </p>
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Built with Modern Technology
          </h2>
          <p className="text-lg text-gray-700 mb-8">
            We use industry-standard, open-source technologies to ensure security, reliability, and performance.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="font-semibold text-gray-900">React</p>
              <p className="text-sm text-gray-600">UI Framework</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="font-semibold text-gray-900">WebRTC</p>
              <p className="text-sm text-gray-600">Video Calls</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="font-semibold text-gray-900">Firebase</p>
              <p className="text-sm text-gray-600">Authentication</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="font-semibold text-gray-900">Socket.io</p>
              <p className="text-sm text-gray-600">Real-time</p>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}

export default AboutUs
