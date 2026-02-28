"""POMs for static/content store pages: Contact, FAQ, Support, Privacy, Ref."""
from selenium.webdriver.common.by import By
from pages.base_page import BasePage
import time


class ContactPage(BasePage):
    HEADING      = (By.TAG_NAME, "h1")
    NAME_INPUT   = (By.CSS_SELECTOR, "input[name='name'], input[placeholder*='name'], input[placeholder*='Name']")
    EMAIL_INPUT  = (By.CSS_SELECTOR, "input[type='email']")
    PHONE_INPUT  = (By.CSS_SELECTOR, "input[type='tel'], input[placeholder*='phone']")
    MESSAGE_AREA = (By.CSS_SELECTOR, "textarea")
    SUBMIT_BTN   = (By.CSS_SELECTOR, "button[type='submit']")
    SUCCESS_MSG  = (By.XPATH, "//*[contains(text(),'Thank') or contains(text(),'sent') or contains(text(),'success')]")
    ERROR_MSG    = (By.CSS_SELECTOR, "[class*='error'], [style*='red']")
    WHATSAPP_LINK = (By.CSS_SELECTOR, "a[href*='wa.me']")
    INSTAGRAM_LINK = (By.CSS_SELECTOR, "a[href*='instagram']")

    def load(self):
        return self.open("/contact")

    def fill_and_submit(self, name: str, email: str, message: str, phone: str = ""):
        if self.exists(*self.NAME_INPUT):
            self.type_text(*self.NAME_INPUT, name)
        if self.exists(*self.EMAIL_INPUT):
            self.type_text(*self.EMAIL_INPUT, email)
        if phone and self.exists(*self.PHONE_INPUT):
            self.type_text(*self.PHONE_INPUT, phone)
        if self.exists(*self.MESSAGE_AREA):
            self.type_text(*self.MESSAGE_AREA, message)
        self.click(*self.SUBMIT_BTN)
        time.sleep(2)

    def has_success(self) -> bool:
        return self.exists(*self.SUCCESS_MSG, 5)

    def has_social_links(self) -> bool:
        return self.exists(*self.WHATSAPP_LINK) or self.exists(*self.INSTAGRAM_LINK)


class FAQPage(BasePage):
    HEADING      = (By.TAG_NAME, "h1")
    FAQ_ITEMS    = (By.CSS_SELECTOR, "details, [class*='accordion'], [class*='faq-item']")
    QUESTIONS    = (By.CSS_SELECTOR, "summary, [class*='question'], button[class*='faq']")
    ANSWERS      = (By.CSS_SELECTOR, "details[open] > *, [class*='answer']")
    CONTACT_LINK = (By.CSS_SELECTOR, "a[href*='contact']")

    def load(self):
        return self.open("/faq")

    def faq_count(self) -> int:
        return self.count(*self.FAQ_ITEMS) or self.count(*self.QUESTIONS)

    def click_first_question(self):
        questions = self.find_all(*self.QUESTIONS)
        if questions:
            self.scroll_to(questions[0])
            questions[0].click()
            time.sleep(0.4)

    def has_contact_link(self) -> bool:
        return self.exists(*self.CONTACT_LINK)


class SupportPage(BasePage):
    HEADING    = (By.TAG_NAME, "h1")
    SECTIONS   = (By.CSS_SELECTOR, "section, [class*='section']")
    LINKS      = (By.TAG_NAME, "a")

    def load(self):
        return self.open("/support")

    def has_content(self) -> bool:
        body = self.driver.find_element(By.TAG_NAME, "body").text
        return len(body.strip()) > 200

    def link_count(self) -> int:
        return self.count(*self.LINKS)


class PrivacyPolicyPage(BasePage):
    HEADING  = (By.TAG_NAME, "h1")
    CONTENT  = (By.CSS_SELECTOR, "p, [class*='content'], main")
    SECTIONS = (By.TAG_NAME, "h2")

    def load(self):
        return self.open("/privacy-policy")

    def section_count(self) -> int:
        return self.count(*self.SECTIONS)

    def has_content(self) -> bool:
        body = self.driver.find_element(By.TAG_NAME, "body").text
        return len(body.strip()) > 500

    def has_legal_keywords(self) -> bool:
        text = self.driver.find_element(By.TAG_NAME, "body").text.lower()
        return any(kw in text for kw in ["privacy", "data", "personal", "information", "cookies"])


class ReferralPage(BasePage):
    HEADING   = (By.TAG_NAME, "h1")
    REDIRECT  = (By.CSS_SELECTOR, "main, body")

    def load(self, code: str = "TEST123"):
        return self.open(f"/ref/{code}")

    def page_loaded(self) -> bool:
        return len(self.driver.find_element(By.TAG_NAME, "body").text.strip()) > 0
