import React from 'react';

export default function ProfessionalHomePage() {
  const features = [
    {
      title: "Transport Maritime",
      description: "Des services de transport maritime fiables et efficaces pour vos marchandises, notamment pour les conteneurs, les véhicules et les marchandises diverses.",
      icon: "",
      gradient: "from-blue-400 to-blue-600"
    },
    {
      title: "Logistique Intégrée",
      description: "Solutions complètes de gestion de la chaîne d'approvisionnement.",
      icon: "",
      gradient: "from-blue-500 to-blue-700"
    },
    {
      title: "Service Client",
      description: "Une équipe dédiée pour vous accompagner dans toutes vos démarches.",
      icon: "",
      gradient: "from-blue-300 to-blue-500"
    },
    {
      title: "Sécurité",
      description: "Des normes de sécurité strictes pour protéger vos marchandises.",
      icon: "",
      gradient: "from-blue-600 to-blue-800"
    }
  ];

  const testimonials = [
    {
      name: "Mohammed Alami",
      role: "Directeur Logistique, Maroc Export",
      content: "Marsa Maroc est notre partenaire de confiance depuis des années. Service impeccable et ponctualité remarquable.",
      avatar: "",
      rating: 5
    },
    {
      name: "Fatima Zahra",
      role: "Responsable Supply Chain, AutoTech",
      content: "La qualité du service et la réactivité des équipes font de Marsa Maroc le meilleur choix pour nos expéditions.",
      avatar: "",
      rating: 5
    },
    {
      name: "Youssef Benali",
      role: "Importateur, AgroMaroc",
      content: "Un service fiable et professionnel. Marsa Maroc a transformé notre façon de gérer le transport maritime.",
      avatar: "",
      rating: 5
    }
  ];

  const stats = [
    { value: "50+", label: "Ans d'expérience", icon: "" },
    { value: "100%", label: "Engagement qualité", icon: "" },
    { value: "500K+", label: "Conteneurs/an", icon: "" },
    { value: "4.8", label: "Satisfaction client", icon: "" }
  ];

  return (
    <div className="relative min-h-screen bg-blue-900 overflow-hidden">
      {/* Arrière-plan principal */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 opacity-90" />

      {/* Navigation */}
      <nav className="relative z-50 flex justify-between items-center px-8 py-6">
        <div className="flex items-center">
          <img 
            src="/logo6.png" 
            alt="Marsa Maroc" 
            className="h-10 w-auto mr-3"
          />
          <span className="text-2xl font-bold text-white">
            Marsa Maroc
          </span>
        </div>

        <div className="hidden md:flex space-x-8">
          {['Accueil', 'Fonctionnalités', 'Témoignages', 'Prix'].map((item) => (
            <a 
              key={item}
              href={`#${item.toLowerCase()}`}
              className="text-gray-300 hover:text-white transition-colors"
            >
              {item}
            </a>
          ))}
        </div>

        <div className="flex space-x-4">
          <button className="px-4 py-2 border border-white/20 text-white rounded-lg hover:bg-white/10 transition-colors">
            Connexion
          </button>
          <button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all">
            Demander un devis
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-40 min-h-screen flex items-center justify-center px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="mb-8">
            <span className="inline-block px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white text-sm border border-white/20">
              Leader du transport maritime
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white">
            Votre partenaire maritime de confiance
          </h1>

          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-12">
            Marsa Maroc : plus de 50 ans d'excellence dans le transport maritime et la logistique au Maroc et à l'international.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-105">
              Contacter un expert
            </button>

            <button className="px-8 py-4 text-white border border-white/20 rounded-lg text-lg font-semibold hover:bg-white/10 transition-all">
              Nos services
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl mb-2">{stat.icon}</div>
                <div className="text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="fonctionnalités" className="relative z-40 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Nos Services
              <span className="block text-2xl text-gray-400 font-normal mt-2">
                Des solutions complètes pour toutes vos besoins logistiques
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all hover:scale-105"
              >
                <div className={`text-4xl mb-4 bg-gradient-to-r ${feature.gradient} bg-clip-text text-transparent`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-300 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="témoignages" className="relative z-40 py-20 px-4 bg-black/20 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Ils nous font confiance
              <span className="block text-2xl text-gray-400 font-normal mt-2">
                Découvrez ce que nos clients pensent de Marsa Maroc
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all"
              >
                <div className="flex items-center mb-4">
                  <div className="text-4xl mr-4">{testimonial.avatar}</div>
                  <div>
                    <h3 className="text-white font-semibold">{testimonial.name}</h3>
                    <p className="text-gray-400 text-sm">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-300 mb-4">"{testimonial.content}"</p>
                <div className="flex">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="text-yellow-400">★</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-40 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-10 left-10 w-20 h-20 bg-blue-500/20 rounded-full blur-xl animate-pulse" />
            <div className="absolute top-20 right-20 w-16 h-16 bg-purple-500/20 rounded-full blur-xl animate-pulse delay-75" />
            <div className="absolute bottom-10 left-1/4 w-24 h-24 bg-pink-500/20 rounded-full blur-xl animate-pulse delay-150" />
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Prêt à nous rejoindre ?
          </h2>
          
          <p className="text-xl text-gray-300 mb-10">
            Faites confiance à l'expertise de Marsa Maroc pour toutes vos expéditions maritimes
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-105">
              Demander un devis
            </button>
            
            <button className="px-8 py-4 text-white border border-white/20 rounded-lg text-lg font-semibold hover:bg-white/10 transition-all">
              Contactez-nous
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-40 border-t border-white/10 py-12 px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Marsa Maroc</h3>
            <p className="text-gray-400 text-sm">
              Leader du transport maritime et de la logistique au Maroc depuis plus de 50 ans.
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Services</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-white">Transport Maritime</a></li>
              <li><a href="#" className="hover:text-white">Logistique</a></li>
              <li><a href="#" className="hover:text-white">Tracking</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-white">Blog</a></li>
              <li><a href="#" className="hover:text-white">Communauté</a></li>
              <li><a href="#" className="hover:text-white">Support</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Légal</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-white">Confidentialité</a></li>
              <li><a href="#" className="hover:text-white">Conditions</a></li>
              <li><a href="#" className="hover:text-white">Cookies</a></li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-6xl mx-auto text-center text-gray-400 text-sm mt-12 pt-8 border-t border-white/10">
          © 2024 Marsa Maroc. Tous droits réservés.
        </div>
      </footer>
    </div>
  );
}