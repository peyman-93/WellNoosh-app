import { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { CuisineExplorer } from './components/CuisineExplorer';
import { PhotoScanner } from './components/PhotoScanner';
import { BudgetDashboard } from './components/BudgetDashboard';
import { Community } from './components/Community';
import { CommunityFeed } from './components/CommunityFeed';
import { AuthScreen } from './components/AuthScreen';
import { LandingPage } from './components/LandingPage';
import { PostAuthSlides } from './components/PostAuthSlides';
import { OnboardingFlow } from './components/OnboardingFlow';
import { MealRecommendations } from './components/MealRecommendations';
import { ProfileScreen } from './components/ProfileScreen';
import { ShopScreen } from './components/ShopScreen';
import { ScheduleScreen } from './components/ScheduleScreen';
import { AnalysisScreen } from './components/AnalysisScreen';
import { LeftoversScreen } from './components/LeftoversScreen';
import { FamilyVoteShare } from './components/FamilyVoteShare';
import { FamilyVoteLanding } from './components/FamilyVoteLanding';
import { VoteResults } from './components/VoteResults';

type AppState = 'landing' | 'auth' | 'postAuthSlides' | 'onboarding' | 'mealRecommendations' | 'authenticated' | 'leftovers' | 'familyVoteShare' | 'familyVoteLanding' | 'voteResults';
type AuthMode = 'login' | 'signup' | 'google';

interface CookedRecipe {
  id: string;
  name: string;
  image: string;
  cookedDate: string;
  rating?: number;
}

interface GroceryItem {
  id: string;
  name: string;
  amount: string;
  category: string;
  addedDate: string;
  fromRecipe?: string;
  completed?: boolean;
}

interface Recipe {
  id: string;
  name: string;
  image: string;
  cookTime: string;
  servings: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  rating: number;
  tags: string[];
  description: string;
  ingredients: {
    name: string;
    amount: string;
    category: string;
  }[];
  instructions: string[];
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

interface UserData {
  fullName: string;
  email: string;
  country: string;
  city: string;
  postalCode: string;
  age?: number;
  gender?: string;
  weight?: number;
  weightUnit?: 'kg' | 'lbs';
  height?: number;
  heightUnit?: 'cm' | 'ft';
  heightFeet?: number;
  heightInches?: number;
  dietStyle?: string[];
  customDietStyle?: string;
  allergies?: string[];
  medicalConditions?: string[];
  activityLevel?: string;
  healthGoals?: string[];
  foodRestrictions?: string[];
  cookingSkill?: string;
  mealPreference?: string;
  subscriptionTier?: 'free' | 'premium';
  dailySwipesUsed?: number;
  lastSwipeDate?: string;
  favoriteRecipes?: string[];
  selectedRecipes?: string[];
  cookedRecipes?: CookedRecipe[];
  leftovers?: string[];
  groceryList?: GroceryItem[];
}

export default function App() {
  const [appState, setAppState] = useState<AppState>('landing');
  const [activeTab, setActiveTab] = useState('home');
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [currentRecipeForVote, setCurrentRecipeForVote] = useState<Recipe | null>(null);
  const [currentVoteId, setCurrentVoteId] = useState<string | null>(null);
  const [tabHistory, setTabHistory] = useState<string[]>(['home']);

  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem('wellnoosh_onboarding_completed');
    const hasSeenFeatureSlides = localStorage.getItem('wellnoosh_feature_slides_seen');
    const hasCompletedMealRecommendations = localStorage.getItem('wellnoosh_meal_recommendations_completed');
    const storedUserData = localStorage.getItem('wellnoosh_user_data');
    
    if (storedUserData) {
      try {
        const parsedUserData = JSON.parse(storedUserData);
        if (!parsedUserData.subscriptionTier) {
          parsedUserData.subscriptionTier = 'free';
          parsedUserData.dailySwipesUsed = 0;
          parsedUserData.lastSwipeDate = new Date().toDateString();
          parsedUserData.favoriteRecipes = [];
          parsedUserData.selectedRecipes = [];
          parsedUserData.cookedRecipes = [];
          parsedUserData.leftovers = [];
          parsedUserData.groceryList = [];
        }
        setUserData(parsedUserData);
        
        if (hasCompletedOnboarding && hasSeenFeatureSlides && hasCompletedMealRecommendations) {
          // For demo purposes, we'll still show landing page but this could be configured
          // setAppState('authenticated');
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (userData && userData.subscriptionTier === 'free') {
      const today = new Date().toDateString();
      if (userData.lastSwipeDate !== today) {
        const updatedUserData = {
          ...userData,
          dailySwipesUsed: 0,
          lastSwipeDate: today
        };
        setUserData(updatedUserData);
        localStorage.setItem('wellnoosh_user_data', JSON.stringify(updatedUserData));
      }
    }
  }, [userData]);

  useEffect(() => {
    const viewport = document.querySelector('meta[name=viewport]');
    if (viewport) {
      viewport.setAttribute('content', 
        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
      );
    }

    const addMetaTag = (name: string, content: string) => {
      if (!document.querySelector(`meta[name="${name}"]`)) {
        const meta = document.createElement('meta');
        meta.name = name;
        meta.content = content;
        document.head.appendChild(meta);
      }
    };

    addMetaTag('apple-mobile-web-app-capable', 'yes');
    addMetaTag('apple-mobile-web-app-status-bar-style', 'default');
    addMetaTag('apple-mobile-web-app-title', 'WellNoosh');
    
    document.addEventListener('touchstart', function() {}, {passive: true});
    document.body.style.overscrollBehavior = 'none';
    
    const handleBackButton = (event: PopStateEvent) => {
      event.preventDefault();
      handleGoBack();
    };

    window.addEventListener('popstate', handleBackButton);
    
    return () => {
      document.body.style.overscrollBehavior = 'auto';
      window.removeEventListener('popstate', handleBackButton);
    };
  }, []);

  const handleGetStarted = () => {
    setAuthMode('signup');
    setAppState('auth');
  };

  const handleSignIn = () => {
    setAuthMode('login');
    setAppState('auth');
  };

  const handleAuthSuccess = (mode: AuthMode, userInfo: UserData) => {
    setAuthMode(mode);
    setIsFirstTimeUser(mode === 'signup' || mode === 'google');
    
    const userWithSubscription = {
      ...userInfo,
      subscriptionTier: 'free' as const,
      dailySwipesUsed: 0,
      lastSwipeDate: new Date().toDateString(),
      favoriteRecipes: [],
      selectedRecipes: [],
      cookedRecipes: [],
      leftovers: [],
      groceryList: []
    };
    
    setUserData(userWithSubscription);
    localStorage.setItem('wellnoosh_user_data', JSON.stringify(userWithSubscription));
    
    if (mode === 'login') {
      setAppState('mealRecommendations');
    } else if (mode === 'google') {
      setAppState('postAuthSlides');
    } else {
      setAppState('postAuthSlides');
    }
  };

  const handleFeatureSlidesComplete = (completeUserData: UserData) => {
    setUserData(completeUserData);
    localStorage.setItem('wellnoosh_user_data', JSON.stringify(completeUserData));
    localStorage.setItem('wellnoosh_feature_slides_seen', 'true');
    setAppState('onboarding');
  };

  const handleFeatureSlidesSkip = () => {
    localStorage.setItem('wellnoosh_feature_slides_seen', 'true');
    setAppState('onboarding');
  };

  const handleOnboardingComplete = (completeUserData: UserData) => {
    setUserData(completeUserData);
    localStorage.setItem('wellnoosh_user_data', JSON.stringify(completeUserData));
    localStorage.setItem('wellnoosh_onboarding_completed', 'true');
    setAppState('mealRecommendations');
  };

  const handleOnboardingSkip = () => {
    const hasCompletedOnboarding = localStorage.getItem('wellnoosh_onboarding_completed');
    if (!hasCompletedOnboarding) {
      localStorage.setItem('wellnoosh_onboarding_completed', 'true');
    }
    setAppState('mealRecommendations');
  };

  const handleMealRecommendationsComplete = (updatedUserData: UserData) => {
    setUserData(updatedUserData);
    localStorage.setItem('wellnoosh_user_data', JSON.stringify(updatedUserData));
    localStorage.setItem('wellnoosh_meal_recommendations_completed', 'true');
    setAppState('authenticated');
    setActiveTab('home');
    setTabHistory(['home']);
    setIsFirstTimeUser(false);
  };

  const handleMealRecommendationsSkip = () => {
    localStorage.setItem('wellnoosh_meal_recommendations_completed', 'true');
    setAppState('authenticated');
    setActiveTab('home');
    setTabHistory(['home']);
    setIsFirstTimeUser(false);
  };

  const handleNavigateToProfile = () => {
    handleTabChange('profile');
  };

  const handleTabChange = (tab: string) => {
    if (tab === 'scan') {
      setAppState('leftovers');
      return;
    }

    if (tab === activeTab) return;
    
    setTabHistory(prev => {
      const newHistory = [...prev];
      if (newHistory[newHistory.length - 1] !== activeTab) {
        newHistory.push(activeTab);
      }
      return newHistory.slice(-10);
    });
    
    setActiveTab(tab);
    
    if (typeof window !== 'undefined') {
      window.history.pushState({ tab }, '', `#${tab}`);
    }
  };

  const handleNavigateToTab = (tab: string) => {
    handleTabChange(tab);
  };

  const handleLeftoversBack = () => {
    setAppState('authenticated');
    setActiveTab('home');
  };

  const handleShareWithFamily = (recipe: Recipe) => {
    setCurrentRecipeForVote(recipe);
    setAppState('familyVoteShare');
  };

  const handleVoteCreated = (voteId: string) => {
    setCurrentVoteId(voteId);
    setAppState('mealRecommendations');
  };

  const handleVoteComplete = (voteId: string) => {
    setCurrentVoteId(voteId);
    setAppState('voteResults');
  };

  const handleStartCooking = () => {
    setCurrentRecipeForVote(null);
    setCurrentVoteId(null);
    setAppState('authenticated');
    setActiveTab('home');
  };

  const handleCreateNewVote = () => {
    setCurrentRecipeForVote(null);
    setCurrentVoteId(null);
    setAppState('mealRecommendations');
  };

  const handleFamilyVoteBack = () => {
    setAppState('mealRecommendations');
  };

  const handleGoBack = () => {
    if (tabHistory.length > 0) {
      const previousTab = tabHistory[tabHistory.length - 1];
      setTabHistory(prev => prev.slice(0, -1));
      setActiveTab(previousTab);
      
      if (typeof window !== 'undefined') {
        window.history.replaceState({ tab: previousTab }, '', `#${previousTab}`);
      }
    }
  };

  const getUserFirstName = () => {
    if (!userData?.fullName) return '';
    return userData.fullName.split(' ')[0];
  };

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <Dashboard 
            onNavigateToProfile={handleNavigateToProfile} 
            onNavigateToTab={handleNavigateToTab}
            isFirstLogin={false}
            onWelcomeComplete={() => {}}
            userData={userData}
          />
        );
      case 'cuisines':
        return <CuisineExplorer onClose={() => setActiveTab('home')} />;
      case 'community':
        return <Community />;
      case 'scan':
        return <PhotoScanner userData={userData} />;
      case 'schedule':
        return <ScheduleScreen userData={userData} onUserDataUpdate={setUserData} />;
      case 'analysis':
        return <AnalysisScreen userData={userData} />;
      case 'shop':
        return <ShopScreen userData={userData} />;
      case 'profile':
        return <ProfileScreen userData={userData} />;
      default:
        return (
          <Dashboard 
            onNavigateToProfile={handleNavigateToProfile} 
            onNavigateToTab={handleNavigateToTab}
            isFirstLogin={false}
            onWelcomeComplete={() => {}}
            userData={userData}
          />
        );
    }
  };

  if (appState === 'familyVoteShare') {
    return (
      <div className="iphone-app">
        <div className="iphone-status-bar">
          <div className="status-bar-content">
            <div className="status-left">
              <span className="time">9:41</span>
            </div>
            <div className="status-center">
              <div className="dynamic-island"></div>
            </div>
            <div className="status-right">
              <div className="battery-container">
                <div className="signal-bars">
                  <div className="bar"></div>
                  <div className="bar"></div>
                  <div className="bar"></div>
                  <div className="bar"></div>
                </div>
                <div className="wifi-icon">📶</div>
                <div className="battery-icon">
                  <div className="battery-level"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <main className="iphone-content">
          {currentRecipeForVote && (
            <FamilyVoteShare 
              recipe={currentRecipeForVote}
              onBack={handleFamilyVoteBack}
              onVoteCreated={handleVoteCreated}
            />
          )}
        </main>
        <div className="iphone-home-indicator">
          <div className="home-indicator-bar"></div>
        </div>
      </div>
    );
  }

  if (appState === 'familyVoteLanding') {
    return (
      <div className="iphone-app">
        <div className="iphone-status-bar">
          <div className="status-bar-content">
            <div className="status-left">
              <span className="time">9:41</span>
            </div>
            <div className="status-center">
              <div className="dynamic-island"></div>
            </div>
            <div className="status-right">
              <div className="battery-container">
                <div className="signal-bars">
                  <div className="bar"></div>
                  <div className="bar"></div>
                  <div className="bar"></div>
                  <div className="bar"></div>
                </div>
                <div className="wifi-icon">📶</div>
                <div className="battery-icon">
                  <div className="battery-level"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <main className="iphone-content">
          {currentVoteId && (
            <FamilyVoteLanding 
              voteId={currentVoteId}
              onVoteComplete={handleVoteComplete}
            />
          )}
        </main>
        <div className="iphone-home-indicator">
          <div className="home-indicator-bar"></div>
        </div>
      </div>
    );
  }

  if (appState === 'voteResults') {
    return (
      <div className="iphone-app">
        <div className="iphone-status-bar">
          <div className="status-bar-content">
            <div className="status-left">
              <span className="time">9:41</span>
            </div>
            <div className="status-center">
              <div className="dynamic-island"></div>
            </div>
            <div className="status-right">
              <div className="battery-container">
                <div className="signal-bars">
                  <div className="bar"></div>
                  <div className="bar"></div>
                  <div className="bar"></div>
                  <div className="bar"></div>
                </div>
                <div className="wifi-icon">📶</div>
                <div className="battery-icon">
                  <div className="battery-level"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <main className="iphone-content">
          {currentVoteId && (
            <VoteResults 
              voteId={currentVoteId}
              onStartCooking={handleStartCooking}
              onCreateNewVote={handleCreateNewVote}
            />
          )}
        </main>
        <div className="iphone-home-indicator">
          <div className="home-indicator-bar"></div>
        </div>
      </div>
    );
  }

  if (appState === 'leftovers') {
    return (
      <div className="iphone-app">
        <div className="iphone-status-bar">
          <div className="status-bar-content">
            <div className="status-left">
              <span className="time">9:41</span>
            </div>
            <div className="status-center">
              <div className="dynamic-island"></div>
            </div>
            <div className="status-right">
              <div className="battery-container">
                <div className="signal-bars">
                  <div className="bar"></div>
                  <div className="bar"></div>
                  <div className="bar"></div>
                  <div className="bar"></div>
                </div>
                <div className="wifi-icon">📶</div>
                <div className="battery-icon">
                  <div className="battery-level"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <main className="iphone-content">
          <LeftoversScreen 
            userData={userData}
            onBack={handleLeftoversBack}
          />
        </main>
        <div className="iphone-home-indicator">
          <div className="home-indicator-bar"></div>
        </div>
      </div>
    );
  }

  if (appState === 'landing') {
    return (
      <div className="iphone-app">
        <div className="iphone-status-bar">
          <div className="status-bar-content">
            <div className="status-left">
              <span className="time">9:41</span>
            </div>
            <div className="status-center">
              <div className="dynamic-island"></div>
            </div>
            <div className="status-right">
              <div className="battery-container">
                <div className="signal-bars">
                  <div className="bar"></div>
                  <div className="bar"></div>
                  <div className="bar"></div>
                  <div className="bar"></div>
                </div>
                <div className="wifi-icon">📶</div>
                <div className="battery-icon">
                  <div className="battery-level"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <main className="iphone-content">
          <LandingPage onGetStarted={handleGetStarted} onSignIn={handleSignIn} />
        </main>
        <div className="iphone-home-indicator">
          <div className="home-indicator-bar"></div>
        </div>
      </div>
    );
  }

  if (appState === 'auth') {
    return (
      <div className="iphone-app">
        <div className="iphone-status-bar">
          <div className="status-bar-content">
            <div className="status-left">
              <span className="time">9:41</span>
            </div>
            <div className="status-center">
              <div className="dynamic-island"></div>
            </div>
            <div className="status-right">
              <div className="battery-container">
                <div className="signal-bars">
                  <div className="bar"></div>
                  <div className="bar"></div>
                  <div className="bar"></div>
                  <div className="bar"></div>
                </div>
                <div className="wifi-icon">📶</div>
                <div className="battery-icon">
                  <div className="battery-level"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <main className="iphone-content">
          <AuthScreen onAuthenticated={handleAuthSuccess} initialMode={authMode} />
        </main>
        <div className="iphone-home-indicator">
          <div className="home-indicator-bar"></div>
        </div>
      </div>
    );
  }

  if (appState === 'postAuthSlides') {
    return (
      <div className="iphone-app">
        <div className="iphone-status-bar">
          <div className="status-bar-content">
            <div className="status-left">
              <span className="time">9:41</span>
            </div>
            <div className="status-center">
              <div className="dynamic-island"></div>
            </div>
            <div className="status-right">
              <div className="battery-container">
                <div className="signal-bars">
                  <div className="bar"></div>
                  <div className="bar"></div>
                  <div className="bar"></div>
                  <div className="bar"></div>
                </div>
                <div className="wifi-icon">📶</div>
                <div className="battery-icon">
                  <div className="battery-level"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <main className="iphone-content">
          <PostAuthSlides 
            onComplete={handleFeatureSlidesComplete}
            onSkip={handleFeatureSlidesSkip}
            userData={userData}
          />
        </main>
        <div className="iphone-home-indicator">
          <div className="home-indicator-bar"></div>
        </div>
      </div>
    );
  }

  if (appState === 'onboarding') {
    return (
      <div className="iphone-app">
        <div className="iphone-status-bar">
          <div className="status-bar-content">
            <div className="status-left">
              <span className="time">9:41</span>
            </div>
            <div className="status-center">
              <div className="dynamic-island"></div>
            </div>
            <div className="status-right">
              <div className="battery-container">
                <div className="signal-bars">
                  <div className="bar"></div>
                  <div className="bar"></div>
                  <div className="bar"></div>
                  <div className="bar"></div>
                </div>
                <div className="wifi-icon">📶</div>
                <div className="battery-icon">
                  <div className="battery-level"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <main className="iphone-content">
          <OnboardingFlow 
            onComplete={handleOnboardingComplete}
            onSkip={handleOnboardingSkip}
            userData={userData}
          />
        </main>
        <div className="iphone-home-indicator">
          <div className="home-indicator-bar"></div>
        </div>
      </div>
    );
  }

  if (appState === 'mealRecommendations') {
    return (
      <div className="iphone-app">
        <div className="iphone-status-bar">
          <div className="status-bar-content">
            <div className="status-left">
              <span className="time">9:41</span>
            </div>
            <div className="status-center">
              <div className="dynamic-island"></div>
            </div>
            <div className="status-right">
              <div className="battery-container">
                <div className="signal-bars">
                  <div className="bar"></div>
                  <div className="bar"></div>
                  <div className="bar"></div>
                  <div className="bar"></div>
                </div>
                <div className="wifi-icon">📶</div>
                <div className="battery-icon">
                  <div className="battery-level"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <main className="iphone-content">
          <MealRecommendations 
            onComplete={handleMealRecommendationsComplete}
            onSkip={handleMealRecommendationsSkip}
            userData={userData}
            onUpdateUserData={setUserData}
            onShareWithFamily={handleShareWithFamily}
          />
        </main>
        <div className="iphone-home-indicator">
          <div className="home-indicator-bar"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="iphone-app">
      <div className="iphone-status-bar">
        <div className="status-bar-content">
          <div className="status-left">
            <span className="time">9:41</span>
          </div>
          <div className="status-center">
            <div className="dynamic-island"></div>
          </div>
          <div className="status-right">
            <div className="battery-container">
              <div className="signal-bars">
                <div className="bar"></div>
                <div className="bar"></div>
                <div className="bar"></div>
                <div className="bar"></div>
              </div>
              <div className="wifi-icon">📶</div>
              <div className="battery-icon">
                <div className="battery-level"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <main className="iphone-content">
        {renderActiveComponent()}
      </main>
      <div className="ios-navigation">
        <Navigation activeTab={activeTab} onTabChange={handleTabChange} />
      </div>
      <div className="iphone-home-indicator">
        <div className="home-indicator-bar"></div>
      </div>
    </div>
  );
}