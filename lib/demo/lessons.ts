import type { Lesson } from "@/lib/domain/types";

export const LESSONS: readonly Lesson[] = [
  {
    slug: "anatomy-of-an-image-ad",
    title: "Anatomy of an image ad",
    summary: "Headline, visual, support line and button: what each part does and how much room it needs.",
    level: "Beginner",
    minutes: 8,
    format: "image",
    relatedAdId: "northwind-spring-sale",
    templateId: "tpl-spring-sale",
    steps: [
      {
        kind: "explain",
        title: "Meet the four parts",
        body: [
          "Almost every effective image ad has the same four parts: a headline, a hero visual, a short support line and one button.",
          "Viewers give a banner about a second. If one part is missing or two parts compete, the second is wasted.",
        ],
        previewAdId: "northwind-spring-sale",
      },
      {
        kind: "explore",
        title: "Write a headline that fits",
        body: [
          "Edit the headline below. Short headlines are read; long ones are skipped. Aim for six words or fewer.",
        ],
        control: "headline",
      },
      {
        kind: "explore",
        title: "Check the contrast",
        body: [
          "Text needs at least 4.5:1 contrast against its background. Change the text color and watch the ratio.",
        ],
        control: "contrast",
      },
      {
        kind: "exercise",
        title: "Pick the stronger button",
        prompt: "The ad is a 20%-off sale on hand tools. Which button label is strongest?",
        options: [
          { id: "a", label: "Click here", correct: false, feedback: "Tells the viewer nothing about what happens next." },
          { id: "b", label: "Shop the sale", correct: true, feedback: "A verb plus the destination: it promises exactly what the landing page delivers." },
          { id: "c", label: "Submit", correct: false, feedback: "Reads like a form, not an offer." },
        ],
      },
      {
        kind: "exercise",
        title: "Find the layout problem",
        prompt: "A banner has a headline, two photos, a coupon code, a logo and three buttons. What should you fix first?",
        options: [
          { id: "a", label: "Keep one button and remove the competing ones", correct: true, feedback: "One clear action. Every extra button splits attention and lowers the chance of any click." },
          { id: "b", label: "Make the logo bigger", correct: false, feedback: "A bigger logo adds noise. The offer is the reason to click." },
          { id: "c", label: "Add more colors", correct: false, feedback: "More color usually adds clutter, not clarity." },
        ],
      },
    ],
  },
  {
    slug: "video-first-five-seconds",
    title: "Video ads: the first five seconds",
    summary: "Open on the product, design for sound-off and end on a card people can act on.",
    level: "Beginner",
    minutes: 7,
    format: "video",
    relatedAdId: "bay12-brew-story",
    templateId: "tpl-video-poster",
    steps: [
      {
        kind: "explain",
        title: "Hook, beat, end card",
        body: [
          "A short video has three jobs: stop the scroll (hook), show one change (beat) and leave a clear next step (end card).",
          "Most viewers start muted, so the hook has to make sense without sound.",
        ],
        previewAdId: "bay12-brew-story",
      },
      {
        kind: "explore",
        title: "Place the poster elements",
        body: ["A poster frame is the first thing a viewer sees. Try the layouts and see which keeps the visual and text apart."],
        control: "layout",
      },
      {
        kind: "exercise",
        title: "Choose the opening frame",
        prompt: "Which opening works best with the sound off?",
        options: [
          { id: "a", label: "A logo animation on a plain background", correct: false, feedback: "Brand first means the viewer waits for the point. Lead with what is being sold." },
          { id: "b", label: "The product in use with a one-line caption", correct: true, feedback: "The caption carries the message without audio." },
          { id: "c", label: "A black frame fading in", correct: false, feedback: "Dead air at the start loses the viewer." },
        ],
      },
      {
        kind: "exercise",
        title: "Design the end card",
        prompt: "What belongs on the last frame?",
        options: [
          { id: "a", label: "Brand, offer and one button, held for a few seconds", correct: true, feedback: "Enough time to read and tap." },
          { id: "b", label: "Fine print only", correct: false, feedback: "Terms matter, but they cannot be the only content." },
          { id: "c", label: "Five links to different pages", correct: false, feedback: "Give one action." },
        ],
      },
    ],
  },
  {
    slug: "calls-to-action-that-click",
    title: "Calls to action that get clicked",
    summary: "Wording, color and message match: the small details that decide whether the button is pressed.",
    level: "Beginner",
    minutes: 6,
    format: "clickable",
    relatedAdId: "northwind-hover-cta",
    templateId: "tpl-spring-sale",
    steps: [
      {
        kind: "explain",
        title: "The click is a promise",
        body: [
          "A button is a promise about what happens next. The landing page has to keep it, in the same words and the same colors.",
          "Open the example in the sandbox and notice how the destination repeats the ad.",
        ],
        previewAdId: "northwind-hover-cta",
      },
      {
        kind: "explore",
        title: "Try different buttons",
        body: ["Change the label and color. Watch the contrast check: a button that is hard to read is hard to press."],
        control: "cta",
      },
      {
        kind: "exercise",
        title: "Match the message",
        prompt: "The ad promises a free calibration certificate. Which landing page headline keeps that promise?",
        options: [
          { id: "a", label: "Our full range of tools", correct: false, feedback: "A broad catalogue breaks the specific promise." },
          { id: "b", label: "Your free calibration certificate", correct: true, feedback: "Same words as the ad. The viewer knows they are in the right place." },
          { id: "c", label: "Welcome", correct: false, feedback: "Generic greetings waste the first second." },
        ],
      },
      {
        kind: "exercise",
        title: "Hover and focus",
        prompt: "Which interaction states should a clickable ad provide?",
        options: [
          { id: "a", label: "Hover and keyboard focus, with the same visible change", correct: true, feedback: "Keyboard users get the same affordance as mouse users." },
          { id: "b", label: "Hover only", correct: false, feedback: "Touch and keyboard users never see a hover." },
          { id: "c", label: "None, keep it still", correct: false, feedback: "Stillness is good for placement, but the button still needs feedback." },
        ],
      },
    ],
  },
  {
    slug: "gamified-ads-and-friction",
    title: "Gamified ads and friction",
    summary: "How many steps are too many, and why the reward has to be honest.",
    level: "Intermediate",
    minutes: 9,
    format: "gamified",
    relatedAdId: "tire-spin",
    templateId: "tpl-square-promo",
    steps: [
      {
        kind: "explain",
        title: "One gesture per step",
        body: [
          "Gamified ads trade a little friction for attention. Each step should ask for one simple gesture: choose, tap or spin.",
          "Try the example in the sandbox. Notice the step counter and that the button only appears after the reward.",
        ],
        previewAdId: "tire-spin",
        callouts: [
          { label: "Required steps", note: "In this demo, steps gate the next button so you can see the pattern. Real viewers must always be able to dismiss an ad." },
        ],
      },
      {
        kind: "exercise",
        title: "How many steps?",
        prompt: "A quiz ad asks four questions before showing the offer. What is the likely result?",
        options: [
          { id: "a", label: "Most viewers abandon before the offer", correct: true, feedback: "Every extra step loses people. Two or three steps is a good ceiling." },
          { id: "b", label: "Completion rises because it feels thorough", correct: false, feedback: "Length rarely helps. Short and rewarding does." },
          { id: "c", label: "Nothing changes", correct: false, feedback: "Friction always has a cost." },
        ],
      },
      {
        kind: "exercise",
        title: "Keep the reward honest",
        prompt: "The spin wheel always lands on a free fitting, but terms say it needs a 200-dollar purchase. What is the problem?",
        options: [
          { id: "a", label: "The reward is not what the viewer is led to expect", correct: true, feedback: "A reward with hidden conditions damages trust, and may breach advertising policies." },
          { id: "b", label: "The wheel should spin slower", correct: false, feedback: "Speed is not the problem." },
          { id: "c", label: "There are too few prizes", correct: false, feedback: "Prize count is fine." },
        ],
      },
    ],
  },
  {
    slug: "carousel-ads-one-idea-per-card",
    title: "Carousel ads: one idea per card",
    summary: "How to sequence cards, why the first one must work alone, and where the button belongs.",
    level: "Intermediate",
    minutes: 8,
    format: "carousel",
    relatedAdId: "northwind-tool-carousel",
    templateId: "tpl-square-promo",
    steps: [
      {
        kind: "explain",
        title: "Cards, cues and one button",
        body: [
          "A carousel packs several cards into one unit. The viewer taps or swipes through them, so every card has to earn the next tap.",
          "Open the example below and step through it. Notice the dots that show your place, and that the button stays in the same spot on every card.",
        ],
        previewAdId: "northwind-tool-carousel",
        callouts: [
          { label: "Lead card", note: "Many viewers never advance. The first card must make sense and sell on its own." },
          { label: "Navigation cues", note: "Arrows and progress dots tell the viewer there is more, and how much." },
        ],
      },
      {
        kind: "explore",
        title: "Write a card headline",
        body: [
          "A card is glanced at, not read. Edit the headline below and keep it to a few words.",
        ],
        control: "headline",
      },
      {
        kind: "exercise",
        title: "Order the cards",
        prompt: "You have three cards: the offer, the product, and a customer result. Which should lead?",
        options: [
          { id: "a", label: "The product, because it shows what this is", correct: true, feedback: "The lead card has to work alone. Start with what the viewer is looking at, then prove it, then make the offer." },
          { id: "b", label: "The offer, in small print", correct: false, feedback: "An offer with no product is a number with no meaning." },
          { id: "c", label: "The customer result, with no context", correct: false, feedback: "Proof only lands once the viewer knows what it proves." },
        ],
      },
      {
        kind: "exercise",
        title: "Auto-advance or not?",
        prompt: "A teammate wants the cards to advance every two seconds so nobody misses one. What is the risk?",
        options: [
          { id: "a", label: "Moving targets cause misclicks and take control from the viewer", correct: true, feedback: "Let the viewer decide when to move on. Auto-advance also makes accidental clicks more likely, which advertising providers treat as a quality problem." },
          { id: "b", label: "The cards will load more slowly", correct: false, feedback: "Loading speed is unaffected." },
          { id: "c", label: "There is no risk if it loops", correct: false, feedback: "Looping does not fix a button that moves under the viewer's finger." },
        ],
      },
    ],
  },
];

export function getLesson(slug: string): Lesson | undefined {
  return LESSONS.find((l) => l.slug === slug);
}
