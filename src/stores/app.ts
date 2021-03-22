import { defineStore } from 'pinia'
import Cookies from 'js-cookie'
import { i18n } from '@/locales/index'
import { ThemeConfig } from '@/models/ThemeConfig.class'
import { HexoConfig } from '@/models/HexoConfig.class'
import { fetchHexoConfig, fetchStatistic } from '@/api'
import { Statistic } from '@/models/Statistic.class'
import NProgress from 'nprogress' // progress bar
import 'nprogress/nprogress.css' // progress bar style

NProgress.configure({
  showSpinner: false,
  trickleSpeed: 100,
  parent: '#loading-bar-wrapper'
}) // NProgress Configuration

/** Fetching the default color-scheme from the OPSystem */
const getSystemMode = (): string => {
  // dark-mode media query matched or not
  const matched = window.matchMedia('(prefers-color-scheme: dark)').matches

  if (matched) return 'theme-dark'
  else return 'theme-light'
}

/**
 * Storing the core data of the application
 */
export const useAppStore = defineStore({
  // id is the name of the store
  // it is used in devtools and allows restoring state
  id: 'app',
  state: () => ({
    /** Current application theme mode `dark` or `light` */
    theme: Cookies.get('theme')
      ? String(Cookies.get('theme'))
      : getSystemMode(),
    /** Current locale of the application */
    locale: Cookies.get('locale') ? Cookies.get('locale') : 'en',
    /** Hexo theme config data */
    themeConfig: new ThemeConfig(),
    /** Hexo engine's config data */
    hexoConfig: new HexoConfig(),
    /** HeaderGradient css property */
    headerGradient: '',
    /** Statistic data base on the blog posts and pages */
    statistic: new Statistic(),
    /** Loading status of the App */
    appLoading: false,
    /** Nprogress's timeout timer id number */
    NPTimeout: -1,
    /** Loading status' timeout timer id number */
    loadingTimeout: -1,
    /** Tracking if the blog config is ready */
    configReady: false,
    /** Header image url */
    headerImage: ''
  }),
  getters: {
    getTheme(): string {
      return this.theme
    },
    getAppLoading(): boolean {
      return this.appLoading
    }
  },
  actions: {
    /** Fetching Hexo and Hexo theme's config data */
    async fetchConfig() {
      this.configReady = false
      const { data } = await fetchHexoConfig()
      this.themeConfig = new ThemeConfig(data)
      this.hexoConfig = new HexoConfig(data)
      this.configReady = true
    },
    /** Fetching blog's statistics */
    async fetchStat() {
      const { data } = await fetchStatistic()
      return new Promise((resolve) => {
        this.statistic = new Statistic(data)
        resolve(this.statistic)
      })
    },
    /** Initializing the theme mode of the app. */
    initializeTheme(isDarkMode?: boolean | string) {
      if (!Cookies.get('theme') && isDarkMode !== 'auto') {
        this.theme = isDarkMode ? 'theme-dark' : 'theme-light'
      }
    },
    /** Switch between dark and light mode */
    toggleTheme(isDark?: boolean) {
      this.theme =
        isDark === true || this.theme === 'theme-light'
          ? 'theme-dark'
          : 'theme-light'
      Cookies.set('theme', this.theme)
    },
    /** Changing the local of the app */
    changeLocale(locale: string) {
      Cookies.set('locale', locale)
      this.locale = locale
      i18n.global.locale = locale
    },
    /**
     * Setting the default locale of the app base on _config
     * @remarks If the user had choose a locale before, this default value will be ignored.
     */
    setDefaultLocale(locale: string) {
      if (Cookies.get('locale')) return
      this.changeLocale(locale)
    },
    /** Start the global loading status of the application */
    startLoading() {
      if (this.appLoading === true) return
      if (this.NPTimeout !== -1) clearTimeout(this.NPTimeout)
      if (this.loadingTimeout !== -1) clearTimeout(this.loadingTimeout)

      NProgress.start()
      this.appLoading = true
    },
    /** Stops the global loading status of the application */
    endLoading() {
      // Leaving the timeout, so the animation have enough time to display
      // in a situation where data loads almost instantly.
      this.NPTimeout = setTimeout(() => {
        NProgress.done()
      }, 100)

      this.loadingTimeout = setTimeout(() => {
        this.appLoading = false
      }, 300)
    },
    /** Setting the image url for the header */
    setHeaderImage(imageUrl: string) {
      this.headerImage = imageUrl
    },
    /** Resetting the header image to null */
    resetHeaderImage() {
      this.headerImage = ''
    }
  }
})
