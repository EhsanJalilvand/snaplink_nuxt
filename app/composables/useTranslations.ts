export function useTranslations() {
  const locale = useAppLocale()
  
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
      },
      preferences: {
        appearance: 'Appearance',
        domains: 'Domains',
        permissions: 'Permissions',
        team: 'Team',
        webhooks: 'Webhooks',
        colorScheme: 'Color Scheme',
        primaryColor: 'Primary Color',
        theme: 'Theme',
        fontFamily: 'Font Family',
        workspaceLogo: 'Workspace Logo',
        saveChanges: 'Save Changes',
        selectBrandColor: 'Select your brand color',
        chooseTheme: 'Choose your preferred theme',
        uploadLogo: 'Upload a logo for your workspace',
        chooseFile: 'Choose File',
        upload: 'Upload',
        remove: 'Remove',
        recommendedSize: 'Recommended size: 512x512px. Max file size: 5MB',
        light: 'Light',
        dark: 'Dark',
        auto: 'Auto',
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
      },
      preferences: {
        appearance: 'ظاهر',
        domains: 'دامنه‌ها',
        permissions: 'مجوزها',
        team: 'تیم',
        webhooks: 'وب‌هوک‌ها',
        colorScheme: 'طرح رنگ',
        primaryColor: 'رنگ اصلی',
        theme: 'تم',
        fontFamily: 'فونت',
        workspaceLogo: 'لوگوی فضای کاری',
        saveChanges: 'ذخیره تغییرات',
        selectBrandColor: 'رنگ برند خود را انتخاب کنید',
        chooseTheme: 'تم مورد نظر خود را انتخاب کنید',
        uploadLogo: 'لوگویی برای فضای کاری خود آپلود کنید',
        chooseFile: 'انتخاب فایل',
        upload: 'آپلود',
        remove: 'حذف',
        recommendedSize: 'اندازه توصیه شده: 512x512px. حداکثر حجم فایل: 5MB',
        light: 'روشن',
        dark: 'تاریک',
        auto: 'خودکار',
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
      },
      preferences: {
        appearance: 'المظهر',
        domains: 'النطاقات',
        permissions: 'الأذونات',
        team: 'الفريق',
        webhooks: 'Webhooks',
        colorScheme: 'مخطط الألوان',
        primaryColor: 'اللون الأساسي',
        theme: 'السمة',
        fontFamily: 'خط العائلة',
        workspaceLogo: 'شعار مساحة العمل',
        saveChanges: 'حفظ التغييرات',
        selectBrandColor: 'اختر لون علامتك التجارية',
        chooseTheme: 'اختر السمة المفضلة لديك',
        uploadLogo: 'قم بتحميل شعار لمساحة العمل الخاصة بك',
        chooseFile: 'اختر الملف',
        upload: 'تحميل',
        remove: 'إزالة',
        recommendedSize: 'الحجم الموصى به: 512x512 بكسل. الحد الأقصى لحجم الملف: 5 ميجابايت',
        light: 'فاتح',
        dark: 'داكن',
        auto: 'تلقائي',
      }
    },
    fr: {
      menu: {
        about: 'À propos',
        activity: 'Activité',
        blog: 'Blog',
        terms: 'Conditions',
        login: 'Connexion',
        register: 'S\'inscrire'
      },
      hero: {
        title: 'Raccourcisseur d\'URL Professionnel et Analytiques',
        subtitle: 'Créez, suivez et analysez vos liens avec des insights puissants. Rejoignez des milliers d\'utilisateurs qui font confiance à SnapLink pour la gestion de leurs liens.',
        getStarted: 'Commencer',
        learnMore: 'En savoir plus'
      },
      features: {
        title: 'Fonctionnalités Puissantes',
        subtitle: 'Tout ce dont vous avez besoin pour gérer et analyser efficacement vos liens',
        urlShortening: {
          title: 'Raccourcissement d\'URL',
          description: 'Créez des liens courts et mémorables instantanément avec notre puissant raccourcisseur d\'URL.'
        },
        analytics: {
          title: 'Analytiques',
          description: 'Suivez les clics, les emplacements, les appareils et plus encore avec des analytiques détaillées.'
        },
        security: {
          title: 'Sécurité',
          description: 'Fonctionnalités de sécurité avancées pour protéger vos liens et données.'
        },
        customization: {
          title: 'Personnalisation',
          description: 'Domaines personnalisés, liens de marque et URLs courtes personnalisées.'
        },
        api: {
          title: 'Accès API',
          description: 'Intégrez avec notre API puissante pour une automatisation transparente.'
        },
        team: {
          title: 'Gestion d\'Équipe',
          description: 'Collaborez avec votre équipe et gérez plusieurs comptes.'
        }
      },
      footer: {
        description: 'Plateforme de raccourcissement d\'URL professionnel et d\'analytiques. Créez, suivez et analysez vos liens avec des insights puissants.',
        product: 'Produit',
        company: 'Entreprise',
        features: 'Fonctionnalités',
        pricing: 'Tarification',
        api: 'API',
        integrations: 'Intégrations',
        about: 'À propos',
        blog: 'Blog',
        careers: 'Carrières',
        contact: 'Contact',
        privacy: 'Politique de Confidentialité',
        terms: 'Conditions de Service',
        copyright: '© 2024 SnapLink. Tous droits réservés.'
      },
      preferences: {
        appearance: 'Apparence',
        domains: 'Domaines',
        permissions: 'Autorisations',
        team: 'Équipe',
        webhooks: 'Webhooks',
        colorScheme: 'Schéma de couleurs',
        primaryColor: 'Couleur principale',
        theme: 'Thème',
        fontFamily: 'Famille de polices',
        workspaceLogo: 'Logo de l\'espace de travail',
        saveChanges: 'Enregistrer les modifications',
        selectBrandColor: 'Sélectionnez votre couleur de marque',
        chooseTheme: 'Choisissez votre thème préféré',
        uploadLogo: 'Téléchargez un logo pour votre espace de travail',
        chooseFile: 'Choisir un fichier',
        upload: 'Télécharger',
        remove: 'Supprimer',
        recommendedSize: 'Taille recommandée: 512x512px. Taille maximale du fichier: 5 Mo',
        light: 'Clair',
        dark: 'Sombre',
        auto: 'Automatique',
      }
    },
    es: {
      menu: {
        about: 'Acerca de',
        activity: 'Actividad',
        blog: 'Blog',
        terms: 'Términos',
        login: 'Iniciar Sesión',
        register: 'Registrarse'
      },
      hero: {
        title: 'Acortador de URL Profesional y Analíticas',
        subtitle: 'Crea, rastrea y analiza tus enlaces con insights poderosos. Únete a miles de usuarios que confían en SnapLink para la gestión de sus enlaces.',
        getStarted: 'Comenzar',
        learnMore: 'Saber Más'
      },
      features: {
        title: 'Características Poderosas',
        subtitle: 'Todo lo que necesitas para gestionar y analizar tus enlaces de manera efectiva',
        urlShortening: {
          title: 'Acortamiento de URL',
          description: 'Crea enlaces cortos y memorables instantáneamente con nuestro poderoso acortador de URL.'
        },
        analytics: {
          title: 'Analíticas',
          description: 'Rastrea clics, ubicaciones, dispositivos y más con analíticas detalladas.'
        },
        security: {
          title: 'Seguridad',
          description: 'Características de seguridad avanzadas para proteger tus enlaces y datos.'
        },
        customization: {
          title: 'Personalización',
          description: 'Dominios personalizados, enlaces de marca y URLs cortas personalizadas.'
        },
        api: {
          title: 'Acceso API',
          description: 'Integra con nuestra API poderosa para automatización perfecta.'
        },
        team: {
          title: 'Gestión de Equipo',
          description: 'Colabora con tu equipo y gestiona múltiples cuentas.'
        }
      },
      footer: {
        description: 'Plataforma de acortamiento de URL profesional y analíticas. Crea, rastrea y analiza tus enlaces con insights poderosos.',
        product: 'Producto',
        company: 'Empresa',
        features: 'Características',
        pricing: 'Precios',
        api: 'API',
        integrations: 'Integraciones',
        about: 'Acerca de',
        blog: 'Blog',
        careers: 'Carreras',
        contact: 'Contacto',
        privacy: 'Política de Privacidad',
        terms: 'Términos de Servicio',
        copyright: '© 2024 SnapLink. Todos los derechos reservados.'
      },
      preferences: {
        appearance: 'Apariencia',
        domains: 'Dominios',
        permissions: 'Permisos',
        team: 'Equipo',
        webhooks: 'Webhooks',
        colorScheme: 'Esquema de colores',
        primaryColor: 'Color principal',
        theme: 'Tema',
        fontFamily: 'Familia de fuentes',
        workspaceLogo: 'Logo del espacio de trabajo',
        saveChanges: 'Guardar cambios',
        selectBrandColor: 'Selecciona el color de tu marca',
        chooseTheme: 'Elige tu tema preferido',
        uploadLogo: 'Sube un logo para tu espacio de trabajo',
        chooseFile: 'Elegir archivo',
        upload: 'Subir',
        remove: 'Eliminar',
        recommendedSize: 'Tamaño recomendado: 512x512px. Tamaño máximo de archivo: 5 MB',
        light: 'Claro',
        dark: 'Oscuro',
        auto: 'Automático',
      }
    },
    de: {
      menu: {
        about: 'Über uns',
        activity: 'Aktivität',
        blog: 'Blog',
        terms: 'Bedingungen',
        login: 'Anmelden',
        register: 'Registrieren'
      },
      hero: {
        title: 'Professioneller URL-Verkürzer und Analytics',
        subtitle: 'Erstellen, verfolgen und analysieren Sie Ihre Links mit leistungsstarken Einblicken. Schließen Sie sich Tausenden von Benutzern an, die SnapLink für die Verwaltung ihrer Links vertrauen.',
        getStarted: 'Loslegen',
        learnMore: 'Mehr erfahren'
      },
      features: {
        title: 'Leistungsstarke Funktionen',
        subtitle: 'Alles was Sie brauchen, um Ihre Links effektiv zu verwalten und zu analysieren',
        urlShortening: {
          title: 'URL-Verkürzung',
          description: 'Erstellen Sie kurze und einprägsame Links sofort mit unserem leistungsstarken URL-Verkürzer.'
        },
        analytics: {
          title: 'Analytics',
          description: 'Verfolgen Sie Klicks, Standorte, Geräte und mehr mit detaillierten Analytics.'
        },
        security: {
          title: 'Sicherheit',
          description: 'Erweiterte Sicherheitsfunktionen zum Schutz Ihrer Links und Daten.'
        },
        customization: {
          title: 'Anpassung',
          description: 'Benutzerdefinierte Domains, Marken-Links und personalisierte kurze URLs.'
        },
        api: {
          title: 'API-Zugang',
          description: 'Integrieren Sie sich mit unserer leistungsstarken API für nahtlose Automatisierung.'
        },
        team: {
          title: 'Team-Management',
          description: 'Arbeiten Sie mit Ihrem Team zusammen und verwalten Sie mehrere Konten.'
        }
      },
      footer: {
        description: 'Professionelle URL-Verkürzungs- und Analytics-Plattform. Erstellen, verfolgen und analysieren Sie Ihre Links mit leistungsstarken Einblicken.',
        product: 'Produkt',
        company: 'Unternehmen',
        features: 'Funktionen',
        pricing: 'Preise',
        api: 'API',
        integrations: 'Integrationen',
        about: 'Über uns',
        blog: 'Blog',
        careers: 'Karrieren',
        contact: 'Kontakt',
        privacy: 'Datenschutzrichtlinie',
        terms: 'Nutzungsbedingungen',
        copyright: '© 2024 SnapLink. Alle Rechte vorbehalten.'
      },
      preferences: {
        appearance: 'Erscheinungsbild',
        domains: 'Domänen',
        permissions: 'Berechtigungen',
        team: 'Team',
        webhooks: 'Webhooks',
        colorScheme: 'Farbschema',
        primaryColor: 'Primärfarbe',
        theme: 'Thema',
        fontFamily: 'Schriftfamilie',
        workspaceLogo: 'Workspace-Logo',
        saveChanges: 'Änderungen speichern',
        selectBrandColor: 'Wählen Sie Ihre Markenfarbe',
        chooseTheme: 'Wählen Sie Ihr bevorzugtes Thema',
        uploadLogo: 'Laden Sie ein Logo für Ihren Workspace hoch',
        chooseFile: 'Datei auswählen',
        upload: 'Hochladen',
        remove: 'Entfernen',
        recommendedSize: 'Empfohlene Größe: 512x512px. Maximale Dateigröße: 5 MB',
        light: 'Hell',
        dark: 'Dunkel',
        auto: 'Automatisch',
      }
    },
    ja: {
      menu: {
        about: 'について',
        activity: 'アクティビティ',
        blog: 'ブログ',
        terms: '利用規約',
        login: 'ログイン',
        register: '登録'
      },
      hero: {
        title: 'プロフェッショナルURL短縮とアナリティクス',
        subtitle: '強力なインサイトでリンクを作成、追跡、分析します。リンク管理にSnapLinkを信頼する何千ものユーザーに参加してください。',
        getStarted: '始める',
        learnMore: '詳細を見る'
      },
      features: {
        title: '強力な機能',
        subtitle: 'リンクを効果的に管理・分析するために必要なすべて',
        urlShortening: {
          title: 'URL短縮',
          description: '強力なURL短縮ツールで短くて覚えやすいリンクを瞬時に作成します。'
        },
        analytics: {
          title: 'アナリティクス',
          description: '詳細なアナリティクスでクリック、場所、デバイスなどを追跡します。'
        },
        security: {
          title: 'セキュリティ',
          description: 'リンクとデータを保護するための高度なセキュリティ機能。'
        },
        customization: {
          title: 'カスタマイズ',
          description: 'カスタムドメイン、ブランドリンク、パーソナライズされた短いURL。'
        },
        api: {
          title: 'APIアクセス',
          description: 'シームレスな自動化のために強力なAPIと統合します。'
        },
        team: {
          title: 'チーム管理',
          description: 'チームと協力し、複数のアカウントを管理します。'
        }
      },
      footer: {
        description: 'プロフェッショナルURL短縮・アナリティクスプラットフォーム。強力なインサイトでリンクを作成、追跡、分析します。',
        product: '製品',
        company: '会社',
        features: '機能',
        pricing: '価格',
        api: 'API',
        integrations: '統合',
        about: 'について',
        blog: 'ブログ',
        careers: 'キャリア',
        contact: 'お問い合わせ',
        privacy: 'プライバシーポリシー',
        terms: '利用規約',
        copyright: '© 2024 SnapLink. 全著作権所有。'
      },
      preferences: {
        appearance: '外観',
        domains: 'ドメイン',
        permissions: '権限',
        team: 'チーム',
        webhooks: 'Webhooks',
        colorScheme: 'カラースキーム',
        primaryColor: 'プライマリカラー',
        theme: 'テーマ',
        fontFamily: 'フォントファミリー',
        workspaceLogo: 'ワークスペースロゴ',
        saveChanges: '変更を保存',
        selectBrandColor: 'ブランドカラーを選択',
        chooseTheme: 'お好みのテーマを選択',
        uploadLogo: 'ワークスペースのロゴをアップロード',
        chooseFile: 'ファイルを選択',
        upload: 'アップロード',
        remove: '削除',
        recommendedSize: '推奨サイズ: 512x512px。最大ファイルサイズ: 5 MB',
        light: 'ライト',
        dark: 'ダーク',
        auto: '自動',
      }
    }
  }
  
  const t = computed(() => {
    return translations[locale.value as keyof typeof translations] || translations.en
  })
  
  return { t, locale }
}