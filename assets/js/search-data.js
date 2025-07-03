// get the ninja-keys element
const ninja = document.querySelector('ninja-keys');

// add the home and posts menu items
ninja.data = [{
    id: "nav-about",
    title: "About",
    section: "Navigation",
    handler: () => {
      window.location.href = "/";
    },
  },{id: "nav-publications",
          title: "Publications",
          description: "",
          section: "Navigation",
          handler: () => {
            window.location.href = "/publications/";
          },
        },{id: "nav-blog",
          title: "Blog",
          description: "",
          section: "Navigation",
          handler: () => {
            window.location.href = "/blog/";
          },
        },{id: "nav-projects",
          title: "Projects",
          description: "A growing collection of your cool projects.",
          section: "Navigation",
          handler: () => {
            window.location.href = "/projects/";
          },
        },{id: "nav-cv",
          title: "CV",
          description: "",
          section: "Navigation",
          handler: () => {
            window.location.href = "/cv/";
          },
        },{id: "nav-talks",
          title: "Talks",
          description: "A collection of my presentations at domestic and international conferences, including invited talks, contributed sessions, and poster presentations.",
          section: "Navigation",
          handler: () => {
            window.location.href = "/talks/";
          },
        },{id: "nav-leadership",
          title: "Leadership",
          description: "Leadership quality and extra curricular activities",
          section: "Navigation",
          handler: () => {
            window.location.href = "/leadership/";
          },
        },{id: "post-smarter-lending-optimization-and-machine-learning-in-loan-default-prediction",
        
          title: "Smarter Lending: Optimization and Machine Learning in Loan Default Prediction",
        
        description: "This blog explores how machine learning and optimization are revolutionizing credit scoring and loan default prediction, leading to smarter, faster, and more profitable lending decisions.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2024/LOAN/";
          
        },
      },{id: "post-accelerating-large-scale-optimization-for-machine-learning",
        
          title: "Accelerating Large-Scale Optimization for Machine Learning",
        
        description: "Enhancing Stochastic Variance Reduced Gradient (SVRG) techniques by incorporating Barzilai-Borwein (BB) approximation as Second-order information and adaptive step-size selection.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2023/SVRG2BB/";
          
        },
      },{id: "books-the-godfather",
          title: 'The Godfather',
          description: "",
          section: "Books",handler: () => {
              window.location.href = "/books/the_godfather/";
            },},{id: "news-a-simple-inline-announcement",
          title: 'A simple inline announcement.',
          description: "",
          section: "News",},{id: "news-a-long-announcement-with-details",
          title: 'A long announcement with details',
          description: "",
          section: "News",handler: () => {
              window.location.href = "/news/announcement_2/";
            },},{id: "news-a-simple-inline-announcement-with-markdown-emoji-sparkles-smile",
          title: 'A simple inline announcement with Markdown emoji! :sparkles: :smile:',
          description: "",
          section: "News",},{id: "projects-credit-card-default-prediction",
          title: 'Credit Card Default Prediction',
          description: "ML pipeline to predict next-month credit default risk",
          section: "Projects",handler: () => {
              window.location.href = "/projects/1_project/";
            },},{id: "projects-accelerating-large-scale-optimization-for-ml",
          title: 'Accelerating Large-Scale Optimization for ML',
          description: "A MATLAB project implementing SVRG-2BB for significantly faster and more stable training of large-scale machine learning models like logistic regression by tackling noisy gradients.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/2_project/";
            },},{id: "projects-reg-nyström-optimization-for-machine-learning",
          title: 'Reg-Nyström Optimization for Machine Learning',
          description: "Hessian Sketching for Scalable ML Optimization is a second-order optimization framework that combines Nyström-based Hessian approximation with adaptive regularization to enable fast, stable training of large-scale machine learning models",
          section: "Projects",handler: () => {
              window.location.href = "/projects/3_project/";
            },},{
        id: 'social-email',
        title: 'email',
        section: 'Socials',
        handler: () => {
          window.open("mailto:%68%61%72%64%69%6B%74%61%6E%6B%61%72%69%61%31%34%30%36@%67%6D%61%69%6C.%63%6F%6D", "_blank");
        },
      },{
        id: 'social-linkedin',
        title: 'LinkedIn',
        section: 'Socials',
        handler: () => {
          window.open("https://www.linkedin.com/in/dr-hardik-tankaria", "_blank");
        },
      },{
        id: 'social-scholar',
        title: 'Google Scholar',
        section: 'Socials',
        handler: () => {
          window.open("https://scholar.google.com/citations?user=Tx4DHMQAAAAJ", "_blank");
        },
      },{
      id: 'light-theme',
      title: 'Change theme to light',
      description: 'Change the theme of the site to Light',
      section: 'Theme',
      handler: () => {
        setThemeSetting("light");
      },
    },
    {
      id: 'dark-theme',
      title: 'Change theme to dark',
      description: 'Change the theme of the site to Dark',
      section: 'Theme',
      handler: () => {
        setThemeSetting("dark");
      },
    },
    {
      id: 'system-theme',
      title: 'Use system default theme',
      description: 'Change the theme of the site to System Default',
      section: 'Theme',
      handler: () => {
        setThemeSetting("system");
      },
    },];
