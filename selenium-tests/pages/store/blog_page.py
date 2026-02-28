"""BlogPage POM — /blog"""
from selenium.webdriver.common.by import By
from pages.base_page import BasePage
import time


class BlogPage(BasePage):
    HEADING       = (By.TAG_NAME, "h1")
    POST_CARDS    = (By.CSS_SELECTOR, "article, [class*='post-card']")
    POST_LINKS    = (By.CSS_SELECTOR, "a[href*='/blog/']")
    TAG_FILTERS   = (By.CSS_SELECTOR, "button[style*='border-radius: 999px'], button[style*='rounded-full']")
    FEATURED_HERO = (By.CSS_SELECTOR, "article[style*='grid']")
    READING_TIME  = (By.XPATH, "//span[contains(@style,'clock') or contains(.,'min')]")
    EMPTY_STATE   = (By.XPATH, "//p[contains(text(),'No posts')]")
    CLOCK_ICON    = (By.CSS_SELECTOR, "svg")  # generic SVG for clock
    ALL_POSTS_BTN = (By.XPATH, "//button[contains(text(),'All Posts')]")

    def load(self):
        return self.open("/blog")

    def post_count(self) -> int:
        return self.count(*self.POST_LINKS)

    def has_posts(self) -> bool:
        return self.post_count() > 0

    def click_first_post(self):
        links = self.find_all(*self.POST_LINKS)
        # Skip anchor tags that are just "/blog" (the listing page itself)
        for link in links:
            href = link.get_attribute("href") or ""
            if "/blog/" in href and len(href) > len("/blog/") + 10:
                self.scroll_to(link)
                link.click()
                return

    def get_post_hrefs(self) -> list:
        links = self.find_all(*self.POST_LINKS)
        return [l.get_attribute("href") for l in links]

    def has_tag_filters(self) -> bool:
        # Look for filter pills (buttons styled as pills)
        btns = self.find_all(By.CSS_SELECTOR, "button")
        pill_btns = [b for b in btns if "999px" in (b.get_attribute("style") or "")]
        return len(pill_btns) > 0

    def click_tag(self, tag_name: str):
        btns = self.find_all(By.CSS_SELECTOR, "button")
        for btn in btns:
            if tag_name.lower() in btn.text.lower():
                self.scroll_to(btn)
                btn.click()
                time.sleep(0.5)
                return

    def click_all_posts(self):
        if self.exists(*self.ALL_POSTS_BTN):
            self.click(*self.ALL_POSTS_BTN)

    def has_featured_hero(self) -> bool:
        # Featured hero is an article with grid style or "Most Popular" badge
        return self.exists(By.XPATH, "//span[contains(text(),'Most Popular')]")

    def has_reading_time(self) -> bool:
        # Look for "min" text in cards
        articles = self.find_all(By.TAG_NAME, "article")
        for article in articles:
            if "min" in article.text:
                return True
        return False


class BlogPostPage(BasePage):
    HEADING         = (By.TAG_NAME, "h1")
    CONTENT         = (By.CSS_SELECTOR, "article, [class*='prose'], [class*='content']")
    READING_TIME    = (By.XPATH, "//*[contains(text(),'min read')]")
    SOCIAL_SHARE    = (By.XPATH, "//*[contains(text(),'Twitter') or contains(text(),'Facebook') or contains(text(),'WhatsApp')]")
    NEWSLETTER_CTA  = (By.CSS_SELECTOR, "input[placeholder*='email']")
    RELATED_POSTS   = (By.XPATH, "//h2[contains(text(),'Related') or contains(text(),'You')]")
    BACK_LINK       = (By.XPATH, "//a[contains(text(),'Back') or contains(@href,'/blog')]")
    TAGS            = (By.CSS_SELECTOR, ".badge-gold, [class*='badge']")
    AUTHOR          = (By.XPATH, "//*[contains(text(),'Krisha')]")
    COPY_LINK_BTN   = (By.XPATH, "//button[contains(text(),'Copy')]")

    def load(self, slug: str):
        return self.open(f"/blog/{slug}")

    def post_heading(self) -> str:
        try:
            return self.find(*self.HEADING).text.strip()
        except Exception:
            return ""

    def has_reading_time(self) -> bool:
        return self.exists(*self.READING_TIME)

    def has_social_share(self) -> bool:
        return self.exists(*self.SOCIAL_SHARE)

    def has_newsletter_cta(self) -> bool:
        return self.exists(*self.NEWSLETTER_CTA)

    def has_related_posts(self) -> bool:
        return self.exists(*self.RELATED_POSTS)

    def has_tags(self) -> bool:
        return self.count(*self.TAGS) > 0

    def click_copy_link(self):
        if self.exists(*self.COPY_LINK_BTN):
            self.click(*self.COPY_LINK_BTN)

    def subscribe_newsletter_cta(self, email: str):
        if self.exists(*self.NEWSLETTER_CTA):
            self.type_text(*self.NEWSLETTER_CTA, email)
            submit = self.find_all(By.CSS_SELECTOR, "button[type='submit']")
            if submit:
                submit[-1].click()
