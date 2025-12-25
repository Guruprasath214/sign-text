import { FaLock, FaRocket, FaUsers, FaVideo } from 'react-icons/fa'
import { Link } from 'react-router-dom'

function Home() {
  return (
    <div className="min-h-screen">
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-beige via-white to-royal-blue/10 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 fade-in">
              Secure Video Calls,
              <span className="text-royal-blue block">Anytime, Anywhere</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Experience crystal-clear video calling with end-to-end encryption. 
              Connect with anyone, anywhere in the world, for free.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup" className="btn-primary text-lg px-8 py-3">
                Get Started Free
              </Link>
              <Link to="/how-it-works" className="btn-secondary text-lg px-8 py-3">
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
            Why Choose SecureCall?
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            
            {/* Feature 1 */}
            <div className="text-center p-6 rounded-lg bg-beige/30 hover:shadow-lg transition-shadow duration-300">
              <div className="flex justify-center mb-4">
                <div className="bg-royal-blue text-white p-4 rounded-full">
                  <FaVideo className="text-3xl" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">HD Video Quality</h3>
              <p className="text-gray-600">
                Crystal-clear video and audio for the best calling experience
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center p-6 rounded-lg bg-beige/30 hover:shadow-lg transition-shadow duration-300">
              <div className="flex justify-center mb-4">
                <div className="bg-royal-blue text-white p-4 rounded-full">
                  <FaLock className="text-3xl" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">End-to-End Encrypted</h3>
              <p className="text-gray-600">
                Your conversations are private and secure with military-grade encryption
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center p-6 rounded-lg bg-beige/30 hover:shadow-lg transition-shadow duration-300">
              <div className="flex justify-center mb-4">
                <div className="bg-royal-blue text-white p-4 rounded-full">
                  <FaUsers className="text-3xl" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Easy to Use</h3>
              <p className="text-gray-600">
                Simple interface, no downloads required. Just sign up and start calling
              </p>
            </div>

            {/* Feature 4 */}
            <div className="text-center p-6 rounded-lg bg-beige/30 hover:shadow-lg transition-shadow duration-300">
              <div className="flex justify-center mb-4">
                <div className="bg-royal-blue text-white p-4 rounded-full">
                  <FaRocket className="text-3xl" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">100% Free</h3>
              <p className="text-gray-600">
                No hidden fees, no subscriptions. Free video calling forever
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-royal-blue to-secondary py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to start connecting?
          </h2>
          <p className="text-xl text-beige mb-8">
            Join thousands of users making secure video calls every day
          </p>
          <Link to="/signup" className="bg-beige text-royal-blue hover:bg-beige-dark font-bold py-3 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 inline-block">
            Create Free Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">
            © 2025 SecureCall. All rights reserved.
          </p>
        </div>
      </footer>

    </div>
  )
}

export default Home
