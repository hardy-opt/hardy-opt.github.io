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
  },{id: "nav-research",
          title: "Research",
          description: "Making expensive information affordable. Second-order optimization at high dimension, and sequential decision-making when each experiment has a price.",
          section: "Navigation",
          handler: () => {
            window.location.href = "/research/";
          },
        },{id: "nav-projects",
          title: "Projects",
          description: "Industrial R&amp;D in optimization and AI for science, my own published optimization research, and one learning project, labelled as such.",
          section: "Navigation",
          handler: () => {
            window.location.href = "/projects/";
          },
        },{id: "nav-publications",
          title: "Publications",
          description: "Peer-reviewed work on second-order and variance-reduced optimization for large-scale machine learning.",
          section: "Navigation",
          handler: () => {
            window.location.href = "/publications/";
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
          description: "Roles where the work was organisational rather than technical, and what each involved.",
          section: "Navigation",
          handler: () => {
            window.location.href = "/leadership/";
          },
        },{id: "nav-blog",
          title: "Blog",
          description: "",
          section: "Navigation",
          handler: () => {
            window.location.href = "/blog/";
          },
        },{id: "post-what-optimization-is-actually-used-for",
        
          title: "What optimization is actually used for",
        
        description: "A tour of the fields that run on mathematical optimization, and in each case the specific thing being minimised, the structure that makes it hard, and the method that gets used.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2026/what-optimization-is-actually-used-for/";
          
        },
      },{id: "post-where-optimization-actually-lives-in-modern-ai",
        
          title: "Where optimization actually lives in modern AI",
        
        description: "A map of the optimization problems inside modern machine learning and generative AI. What is being minimised, which method solves it, why that method and not another, and which parts are still badly solved.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2026/where-optimization-lives-in-modern-ai/";
          
        },
      },{id: "post-continuous-and-discrete-optimization-a-working-map",
        
          title: "Continuous and discrete optimization: a working map",
        
        description: "The two halves of mathematical optimization, what separates them, which methods belong where, how to tell which kind of problem you actually have, and where the two meet.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2026/continuous-and-discrete-optimization-a-map/";
          
        },
      },{id: "post-when-every-experiment-has-a-price",
        
          title: "When every experiment has a price",
        
        description: "Bayesian optimization is usually benchmarked in iterations. Laboratories do not run on iterations. What changes when you count cost instead.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2026/when-every-experiment-has-a-price/";
          
        },
      },{id: "post-nys-fed-making-second-order-federated-learning-fit-on-an-edge-device",
        
          title: "Nys-Fed: making second-order federated learning fit on an edge device",
        
        description: "Newton-type methods converge in far fewer communication rounds than FedAvg, and nobody uses them, because a Hessian for a 25M-parameter model does not fit on a client. Here is what a Nyström sketch changes, with numbers.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2026/nys-fed-second-order-federated-learning/";
          
        },
      },{id: "post-pre-registering-an-experiment-you-expect-to-fail",
        
          title: "Pre-registering an experiment you expect to fail",
        
        description: "Four practices that changed how much I trust my own results, and the one that catches the error no amount of care prevents.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2025/pre-registering-an-experiment-you-expect-to-fail/";
          
        },
      },{id: "post-what-a-hessian-sketch-actually-buys-you",
        
          title: "What a Hessian sketch actually buys you",
        
        description: "Second-order optimization is fast and nobody uses it. Here is the arithmetic of why, and what changes if you only look at 10% of the matrix.",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2025/what-a-hessian-sketch-buys-you/";
          
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
      },{id: "news-invited-talk-at-iit-mandi-on-nys-fed-communication-and-memory-efficient-nyström-approximated-curvature-for-federated-learning",
          title: 'Invited talk at IIT Mandi on Nys-Fed: Communication and Memory Efficient Nyström Approximated...',
          description: "",
          section: "News",},{id: "news-joined-a-materials-informatics-r-amp-amp-d-group-in-tokyo-working-on-bayesian-optimization-for-autonomous-experimentation-and-search-methods-for-computer-aided-synthesis-planning",
          title: 'Joined a materials-informatics R&amp;amp;amp;D group in Tokyo, working on Bayesian optimization for autonomous...',
          description: "",
          section: "News",},{id: "news-two-papers-at-ieee-ijcnn-2026-wcci-maastricht-nysreg-gradient-on-regularized-nyström-curvature-for-large-scale-optimization-and-nys-fed-on-communication-and-memory-efficient-curvature-for-federated-learning",
          title: 'Two papers at IEEE IJCNN 2026 (WCCI, Maastricht): NysReg-Gradient on regularized Nyström curvature...',
          description: "",
          section: "News",},{id: "news-upcoming-presentation-i-am-pleased-to-announce-that-i-will-present-my-research-findings-on-improving-double-ended-synthesis-planning-desp-at-the-49th-symposium-on-chemoinformatics-to-be-held-on-november-11-2026-at-nara-convention-hall-nara-institute-of-science-and-technology",
          title: 'Upcoming Presentation: I am pleased to announce that I will present my research...',
          description: "",
          section: "News",},{id: "projects-cutting-search-cost-in-computer-aided-synthesis-planning",
          title: 'Cutting search cost in computer-aided synthesis planning',
          description: "A learned cost-to-go heuristic for retrosynthetic search. Reordering candidate reactions by their remaining distance to purchasable materials raises the solve rate at unchanged per-step compute. Industrial R&amp;D project, owned end to end.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/1_retrosynthesis_search/";
            },},{id: "projects-bayesian-optimization-that-has-to-pay-for-its-experiments",
          title: 'Bayesian optimization that has to pay for its experiments',
          description: "A closed-loop optimization system for self-driving laboratories where every proposed experiment is priced, charged to a ledger, and refused if the budget cannot cover it. Industrial R&amp;D project, owned end to end.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/2_budget_aware_bo/";
            },},{id: "projects-a-reproducible-handover-between-two-machine-learning-subsystems",
          title: 'A reproducible handover between two machine learning subsystems',
          description: "An installable, versioned component that decides which molecular descriptors describe a property, and whose output is required by test to reproduce the validated result exactly. Industrial R&amp;D project, owned end to end.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/3_ontology_component/";
            },},{id: "projects-regularized-nyström-curvature-for-large-scale-optimization",
          title: 'Regularized Nyström curvature for large-scale optimization',
          description: "Newton&#39;s method costs O(nd² + d³) per step. Sampling a few columns of the Hessian and reconstructing it with the Nyström method brings that to O(ndm + dm²), and a regularizer keeps the step usable when the Hessian is indefinite.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/4_nystrom/";
            },},{id: "projects-variance-reduction-with-barzilai-borwein-step-sizes",
          title: 'Variance reduction with Barzilai-Borwein step sizes',
          description: "SVRG removes most of the noise from stochastic gradients but still needs a step size. The Barzilai-Borwein rule derives one from gradients already computed, making it essentially free curvature information.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/5_svrg_bb/";
            },},{id: "projects-credit-risk-classification",
          title: 'Credit risk classification',
          description: "A self-directed exercise on public UCI credit datasets. End-to-end supervised pipeline with class imbalance handling, cost-sensitive evaluation and model interpretability.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/6_credit_risk/";
            },},{id: "projects-second-order-federated-learning-on-edge-devices",
          title: 'Second-order federated learning on edge devices',
          description: "Newton-type methods converge in far fewer communication rounds than FedAvg, and nobody uses them because a Hessian for a 25M-parameter model does not fit on a client. A sampled low-rank sketch changes that.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/7_nys_fed/";
            },},{
        id: 'social-email',
        title: 'email',
        section: 'Socials',
        handler: () => {
          window.open("mailto:%68%61%72%64%69%6B%74%61%6E%6B%61%72%69%61%31%34%30%36@%67%6D%61%69%6C.%63%6F%6D", "_blank");
        },
      },{
        id: 'social-github',
        title: 'GitHub',
        section: 'Socials',
        handler: () => {
          window.open("https://github.com/hardy-opt", "_blank");
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
