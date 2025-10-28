export function useTranslations() {
  const locale = useState<string>('app-locale', () => 'en')
  
  const translations = {
    en: {
      menu: {
        about: 'About',
        activity: 'Activity',
        blog: 'Blog',
        terms: 'Terms',
        login: 'Login',
        register: 'Register'
      },
      hero: {
        title: 'Professional URL Shortener & Analytics',
        subtitle: 'Create, track, and analyze your links with powerful insights. Join thousands of users who trust SnapLink for their link management needs.',
        getStarted: 'Get Started',
        learnMore: 'Learn More'
      },
      features: {
        title: 'Powerful Features',
        subtitle: 'Everything you need to manage and analyze your links effectively',
        urlShortening: {
          title: 'URL Shortening',
          description: 'Create short, memorable links instantly with our powerful URL shortener.'
        },
        analytics: {
          title: 'Analytics',
          description: 'Track clicks, locations, devices, and more with detailed analytics.'
        },
        security: {
          title: 'Security',
          description: 'Advanced security features to protect your links and data.'
        },
        customization: {
          title: 'Customization',
          description: 'Custom domains, branded links, and personalized short URLs.'
        },
        api: {
          title: 'API Access',
          description: 'Integrate with our powerful API for seamless automation.'
        },
        team: {
          title: 'Team Management',
          description: 'Collaborate with your team and manage multiple accounts.'
        }
      },
      footer: {
        description: 'Professional URL shortener and analytics platform. Create, track, and analyze your links with powerful insights.',
        product: 'Product',
        company: 'Company',
        features: 'Features',
        pricing: 'Pricing',
        api: 'API',
        integrations: 'Integrations',
        about: 'About',
        blog: 'Blog',
        careers: 'Careers',
        contact: 'Contact',
        privacy: 'Privacy Policy',
        terms: 'Terms of Service',
        copyright: '© 2024 SnapLink. All rights reserved.'
      }
    },
    fa: {
      menu: {
        about: 'درباره ما',
        activity: 'فعالیت‌ها',
        blog: 'وبلاگ',
        terms: 'شرایط',
        login: 'ورود',
        register: 'ثبت نام'
      },
      hero: {
        title: 'کوتاه‌کننده حرفه‌ای لینک و آنالیتیکس',
        subtitle: 'لینک‌های خود را ایجاد، ردیابی و تحلیل کنید با بینش‌های قدرتمند. به هزاران کاربری بپیوندید که به SnapLink برای مدیریت لینک‌هایشان اعتماد دارند.',
        getStarted: 'شروع کنید',
        learnMore: 'بیشتر بدانید'
      },
      features: {
        title: 'ویژگی‌های قدرتمند',
        subtitle: 'همه چیزهایی که برای مدیریت و تحلیل مؤثر لینک‌هایتان نیاز دارید',
        urlShortening: {
          title: 'کوتاه کردن لینک',
          description: 'لینک‌های کوتاه و به‌یادماندنی را فوراً با کوتاه‌کننده قدرتمند لینک ما ایجاد کنید.'
        },
        analytics: {
          title: 'آنالیتیکس',
          description: 'کلیک‌ها، مکان‌ها، دستگاه‌ها و موارد دیگر را با آنالیتیکس تفصیلی ردیابی کنید.'
        },
        security: {
          title: 'امنیت',
          description: 'ویژگی‌های امنیتی پیشرفته برای محافظت از لینک‌ها و داده‌هایتان.'
        },
        customization: {
          title: 'سفارشی‌سازی',
          description: 'دامنه‌های سفارشی، لینک‌های برند شده و URL های کوتاه شخصی‌سازی شده.'
        },
        api: {
          title: 'دسترسی API',
          description: 'با API قدرتمند ما برای اتوماسیون بی‌نقص یکپارچه شوید.'
        },
        team: {
          title: 'مدیریت تیم',
          description: 'با تیم خود همکاری کنید و چندین حساب را مدیریت کنید.'
        }
      },
      footer: {
        description: 'پلتفرم کوتاه‌کننده حرفه‌ای لینک و آنالیتیکس. لینک‌های خود را ایجاد، ردیابی و تحلیل کنید با بینش‌های قدرتمند.',
        product: 'محصول',
        company: 'شرکت',
        features: 'ویژگی‌ها',
        pricing: 'قیمت‌گذاری',
        api: 'API',
        integrations: 'یکپارچه‌سازی‌ها',
        about: 'درباره ما',
        blog: 'وبلاگ',
        careers: 'فرصت‌های شغلی',
        contact: 'تماس',
        privacy: 'سیاست حریم خصوصی',
        terms: 'شرایط خدمات',
        copyright: '© 2024 SnapLink. تمام حقوق محفوظ است.'
      }
    },
    ar: {
      menu: {
        about: 'حول',
        activity: 'النشاطات',
        blog: 'المدونة',
        terms: 'الشروط',
        login: 'تسجيل الدخول',
        register: 'التسجيل'
      },
      hero: {
        title: 'اختصار الروابط المهني والتحليلات',
        subtitle: 'أنشئ واتتبع وحلل روابطك مع رؤى قوية. انضم إلى آلاف المستخدمين الذين يثقون في SnapLink لإدارة روابطهم.',
        getStarted: 'ابدأ الآن',
        learnMore: 'اعرف المزيد'
      },
      features: {
        title: 'ميزات قوية',
        subtitle: 'كل ما تحتاجه لإدارة وتحليل روابطك بفعالية',
        urlShortening: {
          title: 'اختصار الروابط',
          description: 'أنشئ روابط قصيرة ومذكورة فوراً مع اختصار الروابط القوي لدينا.'
        },
        analytics: {
          title: 'التحليلات',
          description: 'تتبع النقرات والمواقع والأجهزة والمزيد مع تحليلات مفصلة.'
        },
        security: {
          title: 'الأمان',
          description: 'ميزات أمان متقدمة لحماية روابطك وبياناتك.'
        },
        customization: {
          title: 'التخصيص',
          description: 'نطاقات مخصصة وروابط علامة تجارية وروابط قصيرة شخصية.'
        },
        api: {
          title: 'الوصول إلى API',
          description: 'ادمج مع API القوي لدينا لأتمتة سلسة.'
        },
        team: {
          title: 'إدارة الفريق',
          description: 'تعاون مع فريقك وأدر حسابات متعددة.'
        }
      },
      footer: {
        description: 'منصة اختصار الروابط المهني والتحليلات. أنشئ واتتبع وحلل روابطك مع رؤى قوية.',
        product: 'المنتج',
        company: 'الشركة',
        features: 'الميزات',
        pricing: 'التسعير',
        api: 'API',
        integrations: 'التكاملات',
        about: 'حول',
        blog: 'المدونة',
        careers: 'الوظائف',
        contact: 'اتصل بنا',
        privacy: 'سياسة الخصوصية',
        terms: 'شروط الخدمة',
        copyright: '© 2024 SnapLink. جميع الحقوق محفوظة.'
      }
    }
  }
  
  const t = computed(() => translations[locale.value as keyof typeof translations] || translations.en)
  
  return { t, locale }
}
