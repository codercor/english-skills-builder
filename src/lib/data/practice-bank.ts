import { getStructureUnit } from "@/lib/catalog";
import type {
  ChoiceOption,
  LevelBand,
  PracticeItem,
  PracticeFollowUpMode,
  PracticeInteractionType,
  PromptType,
  RecognitionFeedbackCopy,
  VocabularyTargetItem,
} from "@/lib/types";

export interface PracticeBlueprint {
  prompt: string;
  promptType: PromptType;
  contentSource?: "authored_bank" | "safe_fallback";
  feedbackStrategy?: "generic" | "reported_speech" | "spoken_chunk";
  groundingTargets?: string[];
  allowOpenProduction?: boolean;
  interactionType?: PracticeInteractionType;
  choiceOptions?: ChoiceOption[];
  correctChoiceId?: string;
  choiceFeedbackByOption?: Record<string, RecognitionFeedbackCopy>;
  followUpPrompt?: string;
  followUpPromptType?: PromptType;
  followUpMode?: PracticeFollowUpMode;
  followUpAcceptedAnswer?: string;
  followUpWhyItWorks?: string;
  followUpHint1?: string;
  followUpHint2?: string;
  followUpNaturalRewrite?: string;
  followUpLevelUpVariants?: PracticeItem["levelUpVariants"];
  followUpEvaluationRubric?: PracticeItem["evaluationRubric"];
  structureKey: string;
  levelBand: LevelBand;
  supportObjective: string;
  topic: string;
  memoryAnchor: boolean;
  acceptedAnswer: string;
  whyItWorks: string;
  hint1: string;
  hint2: string;
  naturalRewrite: string;
  levelUpVariants: Array<{ level: LevelBand; text: string }>;
  variantId?: string;
  variantLabel?: string;
  targetItems?: VocabularyTargetItem[];
  targetItemKeys?: string[];
  focusTargetItemKey?: string;
  focusTargetItemLabel?: string;
  evaluationRubric: PracticeItem["evaluationRubric"];
}

// This bank is intentionally mixed: strongly authored items where pedagogy matters,
// safe fallbacks where only tightly grounded tasks are allowed, and builder-specific
// metadata that the shared practice engine can reuse without forking by builder.
const practiceBlueprintBank: Record<string, PracticeBlueprint[]> = {
  articles: [
    {
      prompt: "Write one sentence about a place you visit often. Use the correct article before the key noun.",
      promptType: "memory_anchor",
      structureKey: "articles",
      levelBand: "B1",
      supportObjective: "Improve noun phrase accuracy.",
      topic: "daily life",
      memoryAnchor: true,
      acceptedAnswer: "I go to the library near my home every Saturday morning.",
      whyItWorks: "The sentence marks a specific place with the definite article and keeps the time phrase natural.",
      hint1: "The noun should sound specific, not generic.",
      hint2: "Use the definite article before the place because both you and the listener can identify it.",
      naturalRewrite: "Every Saturday morning, I head to the library near my home to reset for the week.",
      levelUpVariants: [
        { level: "B1", text: "I go to the library near my home every Saturday morning." },
        { level: "B2", text: "Every Saturday morning, I spend a quiet hour in the library near my home." },
        { level: "C1", text: "Every Saturday morning, I retreat to the library near my home, which helps me reset before the week begins." },
      ],
      evaluationRubric: {
        requiredTokens: ["the", "library"],
        preferredPhrases: ["near my home", "every saturday"],
        errorTag: "article_usage",
        commonSlip: "Missing the article before a specific noun.",
        severity: "high",
      },
    },
    {
      prompt: "Rewrite this naturally: I bought book from small shop near station.",
      promptType: "rewrite",
      structureKey: "articles",
      levelBand: "B1",
      supportObjective: "Repair missing articles in a concrete sentence.",
      topic: "shopping",
      memoryAnchor: false,
      acceptedAnswer: "I bought a book from a small shop near the station.",
      whyItWorks: "The sentence adds the indefinite article for first mention and the definite article for a known location.",
      hint1: "Check every singular countable noun.",
      hint2: "One noun is new information, and one noun refers to a specific place.",
      naturalRewrite: "I picked up a book from a small shop near the station.",
      levelUpVariants: [
        { level: "B1", text: "I bought a book from a small shop near the station." },
        { level: "B2", text: "I bought a book from a small independent shop near the station." },
        { level: "C1", text: "I picked up a book from a small independent shop tucked away near the station." },
      ],
      evaluationRubric: {
        requiredTokens: ["a", "book", "a", "small", "the", "station"],
        errorTag: "article_usage",
        commonSlip: "Dropping articles before singular nouns.",
        severity: "high",
      },
    },
    {
      prompt: "Use these constraints in one sentence: movie, friend, last weekend.",
      promptType: "constraint_based",
      structureKey: "articles",
      levelBand: "B1",
      supportObjective: "Keep article control inside constrained production.",
      topic: "weekend memory",
      memoryAnchor: true,
      acceptedAnswer: "I watched a movie with a friend last weekend.",
      whyItWorks: "Both nouns are introduced for the first time, so the indefinite article works naturally.",
      hint1: "Both nouns are singular and countable.",
      hint2: "Use the article that introduces new information.",
      naturalRewrite: "Last weekend, I watched a movie with a friend and finally switched off for a while.",
      levelUpVariants: [
        { level: "B1", text: "I watched a movie with a friend last weekend." },
        { level: "B2", text: "Last weekend, I watched a movie with a friend and had a surprisingly relaxing evening." },
        { level: "C1", text: "Last weekend, I watched a movie with a friend, which turned into exactly the break I needed." },
      ],
      evaluationRubric: {
        requiredTokens: ["a", "movie", "a", "friend"],
        preferredPhrases: ["last weekend"],
        errorTag: "article_usage",
        commonSlip: "Leaving out articles in simple production.",
        severity: "medium",
      },
    },
    {
      prompt: "Describe a room in your home using one sentence with at least two nouns that need articles.",
      promptType: "free_production",
      structureKey: "articles",
      levelBand: "B1",
      supportObjective: "Apply article control in free description.",
      topic: "home",
      memoryAnchor: true,
      acceptedAnswer: "The desk in my room is next to a window and a small lamp.",
      whyItWorks: "A specific desk takes the definite article, while the other items are introduced as indefinite nouns.",
      hint1: "At least one noun should be specific and one should be new information.",
      hint2: "Try using the desk for something specific in your room, then add two new objects.",
      naturalRewrite: "The desk in my room sits beside a window and a small lamp, so it has become my quiet study corner.",
      levelUpVariants: [
        { level: "B1", text: "The desk in my room is next to a window and a small lamp." },
        { level: "B2", text: "The desk in my room sits beside a window and a small lamp, which makes it the easiest place to focus." },
        { level: "C1", text: "The desk in my room sits beside a window and a small lamp, creating the calm corner where I do my best work." },
      ],
      evaluationRubric: {
        requiredTokens: ["the", "desk", "a", "window", "a", "lamp"],
        errorTag: "article_usage",
        commonSlip: "Not distinguishing specific and nonspecific nouns.",
        severity: "medium",
      },
    },
    {
      prompt: "Upgrade this idea to B2 and keep article accuracy: teacher gave useful advice before exam.",
      promptType: "guided_generation",
      structureKey: "articles",
      levelBand: "B1",
      supportObjective: "Combine accuracy with a richer sentence.",
      topic: "learning",
      memoryAnchor: false,
      acceptedAnswer: "The teacher gave me useful advice before the exam.",
      whyItWorks: "The sentence uses a known teacher and a specific exam with the definite article, while keeping advice uncountable.",
      hint1: "One noun is specific, and one noun is uncountable.",
      hint2: "Use the definite article for the teacher and the exam, but no article for advice.",
      naturalRewrite: "The teacher gave me useful advice before the exam, which helped me feel far more prepared.",
      levelUpVariants: [
        { level: "B1", text: "The teacher gave me useful advice before the exam." },
        { level: "B2", text: "The teacher gave me useful advice before the exam, and it made my plan much clearer." },
        { level: "C1", text: "The teacher gave me useful advice before the exam, which sharpened both my plan and my confidence." },
      ],
      evaluationRubric: {
        requiredTokens: ["the", "teacher", "advice", "the", "exam"],
        errorTag: "article_usage",
        commonSlip: "Adding an article before uncountable advice or missing it before specific nouns.",
        severity: "high",
      },
    },
  ],
  "present-perfect": [
    {
      prompt: "Write one sentence about a skill you have improved recently using present perfect.",
      promptType: "memory_anchor",
      structureKey: "present-perfect",
      levelBand: "B1",
      supportObjective: "Control tense consistency.",
      topic: "self-development",
      memoryAnchor: true,
      acceptedAnswer: "I have improved my speaking confidence a lot this year.",
      whyItWorks: "Present perfect connects a past process to a present result.",
      hint1: "Use have or has plus a past participle.",
      hint2: "The action should still matter now.",
      naturalRewrite: "I have improved my speaking confidence a lot this year, especially in longer conversations.",
      levelUpVariants: [
        { level: "B1", text: "I have improved my speaking confidence a lot this year." },
        { level: "B2", text: "I have improved my speaking confidence a lot this year, so I hesitate much less in discussions." },
        { level: "C1", text: "I have improved my speaking confidence significantly this year, which has made longer discussions far less intimidating." },
      ],
      evaluationRubric: {
        requiredTokens: ["have", "improved"],
        errorTag: "present_perfect_control",
        commonSlip: "Switching back to simple past when the result still matters now.",
        severity: "high",
      },
    },
    {
      prompt: "Complete the sentence naturally: I ____ never ____ this kind of project before.",
      promptType: "completion",
      structureKey: "present-perfect",
      levelBand: "B1",
      supportObjective: "Control auxiliary plus participle form.",
      topic: "work",
      memoryAnchor: false,
      acceptedAnswer: "I have never handled this kind of project before.",
      whyItWorks: "The tense shows life experience up to the present moment.",
      hint1: "You need the auxiliary and a past participle.",
      hint2: "Use the form that shows experience up to now.",
      naturalRewrite: "I have never handled this kind of project before, so I am learning fast as I go.",
      levelUpVariants: [
        { level: "B1", text: "I have never handled this kind of project before." },
        { level: "B2", text: "I have never handled this kind of project before, which is why every step still feels new." },
        { level: "C1", text: "I have never handled this kind of project before, so each stage has pushed me to adapt more quickly than usual." },
      ],
      evaluationRubric: {
        requiredTokens: ["have", "handled", "before"],
        errorTag: "present_perfect_control",
        commonSlip: "Dropping the auxiliary or choosing the wrong verb form.",
        severity: "high",
      },
    },
    {
      prompt: "Rewrite this naturally: I am in this city for three years.",
      promptType: "rewrite",
      structureKey: "present-perfect",
      levelBand: "B1",
      supportObjective: "Link duration to the present.",
      topic: "daily life",
      memoryAnchor: false,
      acceptedAnswer: "I have lived in this city for three years.",
      whyItWorks: "For durations that continue to the present, present perfect is the natural choice.",
      hint1: "The action started in the past and continues now.",
      hint2: "Use have plus a past participle with for three years.",
      naturalRewrite: "I have lived in this city for three years, and it already feels like home.",
      levelUpVariants: [
        { level: "B1", text: "I have lived in this city for three years." },
        { level: "B2", text: "I have lived in this city for three years, so I know its rhythms quite well now." },
        { level: "C1", text: "I have lived in this city for three years, which has given me enough time to feel woven into its daily rhythm." },
      ],
      evaluationRubric: {
        requiredTokens: ["have", "lived", "for", "three", "years"],
        errorTag: "present_perfect_duration",
        commonSlip: "Using present simple instead of present perfect for continuing duration.",
        severity: "high",
      },
    },
    {
      prompt: "Use these words in one sentence: finish, already, report.",
      promptType: "constraint_based",
      structureKey: "present-perfect",
      levelBand: "B1",
      supportObjective: "Use common present perfect adverbs naturally.",
      topic: "tasks",
      memoryAnchor: false,
      acceptedAnswer: "I have already finished the report.",
      whyItWorks: "Already commonly appears with present perfect to show an earlier-than-expected result.",
      hint1: "Use present perfect, not simple past.",
      hint2: "Put already in the sentence naturally after have.",
      naturalRewrite: "I have already finished the report, so I can finally move on to the next task.",
      levelUpVariants: [
        { level: "B1", text: "I have already finished the report." },
        { level: "B2", text: "I have already finished the report, so I can shift my attention to the next task." },
        { level: "C1", text: "I have already finished the report, which means I can spend the rest of the afternoon on the more strategic work." },
      ],
      evaluationRubric: {
        requiredTokens: ["have", "already", "finished", "report"],
        errorTag: "present_perfect_adverb_position",
        commonSlip: "Using the wrong tense or awkward adverb placement.",
        severity: "medium",
      },
    },
    {
      prompt: "Correct the error: She has went to the meeting already.",
      promptType: "error_correction",
      structureKey: "present-perfect",
      levelBand: "B1",
      supportObjective: "Choose the correct participle form.",
      topic: "work",
      memoryAnchor: false,
      acceptedAnswer: "She has gone to the meeting already.",
      whyItWorks: "Present perfect needs the past participle gone, not the past form went.",
      hint1: "The problem is the verb form after has.",
      hint2: "You need the past participle, not the simple past form.",
      naturalRewrite: "She has already gone to the meeting.",
      levelUpVariants: [
        { level: "B1", text: "She has gone to the meeting already." },
        { level: "B2", text: "She has already gone to the meeting, so you may need to message her instead." },
        { level: "C1", text: "She has already gone to the meeting, which means the decision may be made before we arrive." },
      ],
      evaluationRubric: {
        requiredTokens: ["has", "gone", "meeting"],
        errorTag: "present_perfect_participle",
        commonSlip: "Using the simple past instead of the past participle.",
        severity: "high",
      },
    },
  ],
  "past-vs-present-perfect": [
    {
      prompt: "Which sentence fits the time marker more naturally?",
      promptType: "rewrite",
      interactionType: "hybrid_choice_text",
      choiceOptions: [
        { id: "A", text: "I saw her yesterday." },
        { id: "B", text: "I have seen her yesterday." },
      ],
      correctChoiceId: "A",
      choiceFeedbackByOption: {
        B: {
          whatWentWrong:
            "The sentence keeps present perfect with a finished past time marker.",
          why: "Yesterday closes the time window, so English moves to simple past here.",
          whatFitsInstead: `Choose "I saw her yesterday." because the time is fully finished.`,
        },
      },
      followUpPrompt: "Rewrite only the better sentence exactly before you move on.",
      followUpPromptType: "rewrite",
      followUpMode: "exact_rewrite",
      followUpAcceptedAnswer: "I saw her yesterday.",
      followUpWhyItWorks:
        "You kept the finished-time marker and matched it with simple past.",
      followUpHint1: "Keep the finished time marker and change only the tense choice.",
      followUpHint2: "Yesterday blocks present perfect, so keep the verb in simple past.",
      followUpNaturalRewrite: "I saw her yesterday, so I already know what she decided.",
      followUpLevelUpVariants: [
        { level: "B1", text: "I saw her yesterday." },
        { level: "B2", text: "I saw her yesterday, so I already know what she decided." },
        { level: "C1", text: "I saw her yesterday, which is why her reaction is still fresh in my mind." },
      ],
      followUpEvaluationRubric: {
        requiredTokens: ["saw", "yesterday"],
        errorTag: "tense_time_conflict",
        commonSlip: "Using present perfect with a finished past time marker.",
        severity: "high",
      },
      structureKey: "past-vs-present-perfect",
      levelBand: "B1",
      supportObjective: "Separate finished time from present relevance.",
      topic: "conversation",
      memoryAnchor: false,
      acceptedAnswer: "I saw her yesterday.",
      whyItWorks: "Yesterday is a finished time marker, so simple past is the correct choice.",
      hint1: "Look at the time expression.",
      hint2: "Finished time expressions usually block present perfect.",
      naturalRewrite: "I saw her yesterday, so I already know what she decided.",
      levelUpVariants: [
        { level: "B1", text: "I saw her yesterday." },
        { level: "B2", text: "I saw her yesterday, so I already know what she decided." },
        { level: "C1", text: "I saw her yesterday, which is why her reaction is still fresh in my mind." },
      ],
      evaluationRubric: {
        requiredTokens: ["saw", "yesterday"],
        errorTag: "tense_time_conflict",
        commonSlip: "Using present perfect with a finished past time marker.",
        severity: "high",
      },
    },
    {
      prompt: "Complete the sentence naturally: I ____ never ____ that restaurant, so I cannot compare it yet.",
      promptType: "completion",
      structureKey: "past-vs-present-perfect",
      levelBand: "B1",
      supportObjective: "Use present perfect for life experience.",
      topic: "food",
      memoryAnchor: false,
      acceptedAnswer: "I have never tried that restaurant, so I cannot compare it yet.",
      whyItWorks: "The sentence describes experience up to now, not a finished moment.",
      hint1: "This is about experience, not a finished time in the past.",
      hint2: "Use present perfect with have and a past participle.",
      naturalRewrite: "I have never tried that restaurant, so I cannot compare it with the others yet.",
      levelUpVariants: [
        { level: "B1", text: "I have never tried that restaurant, so I cannot compare it yet." },
        { level: "B2", text: "I have never tried that restaurant, so I still do not have a fair basis for comparison." },
        { level: "C1", text: "I have never tried that restaurant, so any comparison from me would be based on hearsay rather than experience." },
      ],
      evaluationRubric: {
        requiredTokens: ["have", "tried", "yet"],
        errorTag: "experience_vs_finished_time",
        commonSlip: "Choosing simple past when the meaning is life experience up to now.",
        severity: "medium",
      },
    },
    {
      prompt: "Correct the error: We have finished the task last night.",
      promptType: "error_correction",
      structureKey: "past-vs-present-perfect",
      levelBand: "B1",
      supportObjective: "Fix tense choice with finished-time markers.",
      topic: "work",
      memoryAnchor: false,
      acceptedAnswer: "We finished the task last night.",
      whyItWorks: "Last night makes the event finished and specific, so simple past is required.",
      hint1: "Look at the time phrase.",
      hint2: "A specific finished time pushes the sentence into simple past.",
      naturalRewrite: "We finished the task last night, so the team could start fresh this morning.",
      levelUpVariants: [
        { level: "B1", text: "We finished the task last night." },
        { level: "B2", text: "We finished the task last night, which gave the team a cleaner start this morning." },
        { level: "C1", text: "We finished the task last night, which meant the team could begin today without any leftover pressure." },
      ],
      evaluationRubric: {
        requiredTokens: ["finished", "last", "night"],
        errorTag: "tense_time_conflict",
        commonSlip: "Mixing present perfect with a completed time expression.",
        severity: "high",
      },
    },
    {
      prompt: "Write one sentence about a change in your routine that still matters now.",
      promptType: "memory_anchor",
      structureKey: "past-vs-present-perfect",
      levelBand: "B1",
      supportObjective: "Show present relevance clearly.",
      topic: "habits",
      memoryAnchor: true,
      acceptedAnswer: "I have changed my morning routine, and now I feel more focused.",
      whyItWorks: "The first clause uses present perfect because the change still affects the present.",
      hint1: "The result should still be true now.",
      hint2: "Use present perfect for the change and connect it to a present effect.",
      naturalRewrite: "I have changed my morning routine, and now I feel much more focused before work begins.",
      levelUpVariants: [
        { level: "B1", text: "I have changed my morning routine, and now I feel more focused." },
        { level: "B2", text: "I have changed my morning routine, and the difference in my focus is obvious by midday." },
        { level: "C1", text: "I have changed my morning routine, and that shift has had a noticeable effect on how focused I feel throughout the day." },
      ],
      evaluationRubric: {
        requiredTokens: ["have", "changed", "now"],
        errorTag: "present_relevance",
        commonSlip: "Using simple past when the result still shapes the present.",
        severity: "medium",
      },
    },
    {
      prompt: "Use these ideas in one sentence: finish, report, this morning.",
      promptType: "guided_generation",
      structureKey: "past-vs-present-perfect",
      levelBand: "B1",
      supportObjective: "Pick the tense that matches the time marker.",
      topic: "reporting",
      memoryAnchor: false,
      acceptedAnswer: "I finished the report this morning.",
      whyItWorks: "This morning acts like a finished time period here, so simple past is natural.",
      hint1: "The time marker is specific.",
      hint2: "Finished time phrases usually need simple past.",
      naturalRewrite: "I finished the report this morning, so the next stage can begin on time.",
      levelUpVariants: [
        { level: "B1", text: "I finished the report this morning." },
        { level: "B2", text: "I finished the report this morning, so the next stage can begin on time." },
        { level: "C1", text: "I finished the report this morning, which means the team can move into the next stage without delay." },
      ],
      evaluationRubric: {
        requiredTokens: ["finished", "report", "this", "morning"],
        errorTag: "tense_time_choice",
        commonSlip: "Ignoring the time signal when selecting the tense.",
        severity: "medium",
      },
    },
  ],
  prepositions: [
    {
      prompt: "Rewrite this naturally: I go to gym every day and study in night.",
      promptType: "rewrite",
      structureKey: "prepositions",
      levelBand: "B1",
      supportObjective: "Fix frequent phrasing slips.",
      topic: "routine",
      memoryAnchor: false,
      acceptedAnswer: "I go to the gym every day and study at night.",
      whyItWorks: "The sentence uses the natural preposition with time expressions and the article with gym.",
      hint1: "One phrase needs an article, and one needs a different time preposition.",
      hint2: "Use the gym and at night.",
      naturalRewrite: "I go to the gym every day and study at night when everything is quieter.",
      levelUpVariants: [
        { level: "B1", text: "I go to the gym every day and study at night." },
        { level: "B2", text: "I go to the gym every day and study at night, which helps me separate energy from focus." },
        { level: "C1", text: "I go to the gym every day and study at night, a routine that keeps both my energy and focus in balance." },
      ],
      evaluationRubric: {
        requiredTokens: ["the", "gym", "at", "night"],
        errorTag: "preposition_choice",
        commonSlip: "Choosing literal prepositions instead of natural English chunks.",
        severity: "high",
      },
    },
    {
      prompt: "Complete the sentence naturally: I am interested ____ learning how to sound more natural.",
      promptType: "completion",
      structureKey: "prepositions",
      levelBand: "B1",
      supportObjective: "Use natural adjective-preposition patterns.",
      topic: "learning",
      memoryAnchor: false,
      acceptedAnswer: "I am interested in learning how to sound more natural.",
      whyItWorks: "Interested naturally pairs with in.",
      hint1: "This adjective usually takes one common preposition.",
      hint2: "Use the standard adjective-preposition pairing.",
      naturalRewrite: "I am interested in learning how to sound more natural in everyday conversations.",
      levelUpVariants: [
        { level: "B1", text: "I am interested in learning how to sound more natural." },
        { level: "B2", text: "I am interested in learning how to sound more natural in everyday conversations." },
        { level: "C1", text: "I am interested in learning how to sound more natural in everyday conversations, especially when I need to react quickly." },
      ],
      evaluationRubric: {
        requiredTokens: ["interested", "in"],
        errorTag: "preposition_collocation",
        commonSlip: "Using the wrong preposition after an adjective.",
        severity: "medium",
      },
    },
    {
      prompt: "Correct the error: We discussed about the problem during the meeting.",
      promptType: "error_correction",
      structureKey: "prepositions",
      levelBand: "B1",
      supportObjective: "Remove unnecessary prepositions.",
      topic: "meetings",
      memoryAnchor: false,
      acceptedAnswer: "We discussed the problem during the meeting.",
      whyItWorks: "Discuss does not need about before its object.",
      hint1: "The verb already takes a direct object.",
      hint2: "One preposition should disappear completely.",
      naturalRewrite: "We discussed the problem during the meeting and left with a clearer plan.",
      levelUpVariants: [
        { level: "B1", text: "We discussed the problem during the meeting." },
        { level: "B2", text: "We discussed the problem during the meeting and left with a clearer plan." },
        { level: "C1", text: "We discussed the problem during the meeting and came away with a far clearer sense of direction." },
      ],
      evaluationRubric: {
        requiredTokens: ["discussed", "problem", "during", "meeting"],
        errorTag: "extra_preposition",
        commonSlip: "Adding an unnecessary preposition after a transitive verb.",
        severity: "medium",
      },
    },
    {
      prompt: "Write one sentence about your study routine using at least two natural prepositions.",
      promptType: "memory_anchor",
      structureKey: "prepositions",
      levelBand: "B1",
      supportObjective: "Use prepositions naturally in a personal context.",
      topic: "study routine",
      memoryAnchor: true,
      acceptedAnswer: "I usually study at home in the evening after dinner.",
      whyItWorks: "The sentence uses natural time and place prepositions without sounding translated.",
      hint1: "Use one place preposition and one time preposition.",
      hint2: "Think of a natural routine like at home, in the evening, or after dinner.",
      naturalRewrite: "I usually study at home in the evening after dinner, when I can finally concentrate.",
      levelUpVariants: [
        { level: "B1", text: "I usually study at home in the evening after dinner." },
        { level: "B2", text: "I usually study at home in the evening after dinner, when the day finally quiets down." },
        { level: "C1", text: "I usually study at home in the evening after dinner, once the day has settled enough for me to focus deeply." },
      ],
      evaluationRubric: {
        requiredTokens: ["at", "in", "after"],
        errorTag: "preposition_choice",
        commonSlip: "Using literal rather than natural preposition phrases.",
        severity: "medium",
      },
    },
    {
      prompt: "Use these words in one sentence: responsible, team, results.",
      promptType: "guided_generation",
      structureKey: "prepositions",
      levelBand: "B1",
      supportObjective: "Control adjective-preposition combinations under constraint.",
      topic: "work",
      memoryAnchor: false,
      acceptedAnswer: "She is responsible for the team results.",
      whyItWorks: "Responsible pairs naturally with for.",
      hint1: "This adjective usually takes one fixed preposition.",
      hint2: "Use the common pattern with responsible.",
      naturalRewrite: "She is responsible for the team results, so everyone turns to her when pressure rises.",
      levelUpVariants: [
        { level: "B1", text: "She is responsible for the team results." },
        { level: "B2", text: "She is responsible for the team results, so her decisions carry real weight." },
        { level: "C1", text: "She is responsible for the team results, which means every decision she makes carries visible consequences." },
      ],
      evaluationRubric: {
        requiredTokens: ["responsible", "for", "team", "results"],
        errorTag: "preposition_collocation",
        commonSlip: "Using the wrong preposition after an adjective.",
        severity: "medium",
      },
    },
  ],
  modals: [
    {
      prompt: "Write one sentence giving advice to a friend who feels overwhelmed.",
      promptType: "memory_anchor",
      structureKey: "modals",
      levelBand: "B1",
      supportObjective: "Increase control over tone.",
      topic: "advice",
      memoryAnchor: true,
      acceptedAnswer: "You should take a short break before you try again.",
      whyItWorks: "Should gives clear advice without sounding too strong.",
      hint1: "Use a modal that sounds like advice.",
      hint2: "Choose a modal softer than must.",
      naturalRewrite: "You should take a short break before you try again, because your mind probably needs space.",
      levelUpVariants: [
        { level: "B1", text: "You should take a short break before you try again." },
        { level: "B2", text: "You should take a short break before you try again, so you can return with more focus." },
        { level: "C1", text: "You should take a short break before you try again, since pushing through that pressure rarely leads to better work." },
      ],
      evaluationRubric: {
        requiredTokens: ["should"],
        errorTag: "modal_control",
        commonSlip: "Choosing a modal with the wrong level of force.",
        severity: "medium",
      },
    },
    {
      prompt: "Rewrite this naturally: It is possible that he is at the office now.",
      promptType: "rewrite",
      structureKey: "modals",
      levelBand: "B1",
      supportObjective: "Express possibility more naturally.",
      topic: "work",
      memoryAnchor: false,
      acceptedAnswer: "He might be at the office now.",
      whyItWorks: "Might expresses possibility more naturally than a heavy full clause.",
      hint1: "Use a modal of possibility.",
      hint2: "Replace the long phrase with might.",
      naturalRewrite: "He might be at the office now, especially if the meeting ran late.",
      levelUpVariants: [
        { level: "B1", text: "He might be at the office now." },
        { level: "B2", text: "He might be at the office now, especially if the meeting ran late." },
        { level: "C1", text: "He might still be at the office now, particularly if the meeting lasted longer than expected." },
      ],
      evaluationRubric: {
        requiredTokens: ["might", "office"],
        errorTag: "modal_possibility",
        commonSlip: "Using longer structures when a modal would sound more natural.",
        severity: "medium",
      },
    },
    {
      prompt: "Complete the sentence naturally: You ____ submit the form by Friday or the system will close.",
      promptType: "completion",
      structureKey: "modals",
      levelBand: "B1",
      supportObjective: "Use obligation with the right force.",
      topic: "deadlines",
      memoryAnchor: false,
      acceptedAnswer: "You must submit the form by Friday or the system will close.",
      whyItWorks: "Must expresses strong necessity clearly.",
      hint1: "The sentence expresses obligation, not advice.",
      hint2: "Use the modal that signals necessity.",
      naturalRewrite: "You must submit the form by Friday, or the system will close automatically.",
      levelUpVariants: [
        { level: "B1", text: "You must submit the form by Friday or the system will close." },
        { level: "B2", text: "You must submit the form by Friday, or the system will close automatically." },
        { level: "C1", text: "You must submit the form by Friday, otherwise the system will close and the request will roll over." },
      ],
      evaluationRubric: {
        requiredTokens: ["must", "submit", "friday"],
        errorTag: "modal_obligation",
        commonSlip: "Using a weak modal when the meaning is strong obligation.",
        severity: "high",
      },
    },
    {
      prompt: "Correct the error: You should to speak with the manager first.",
      promptType: "error_correction",
      structureKey: "modals",
      levelBand: "B1",
      supportObjective: "Keep the form after modals clean.",
      topic: "work",
      memoryAnchor: false,
      acceptedAnswer: "You should speak with the manager first.",
      whyItWorks: "Modals are followed by the base form, not to + verb.",
      hint1: "The problem comes after the modal.",
      hint2: "Modals take the bare infinitive.",
      naturalRewrite: "You should speak with the manager first before the situation gets more confusing.",
      levelUpVariants: [
        { level: "B1", text: "You should speak with the manager first." },
        { level: "B2", text: "You should speak with the manager first, so the issue does not grow unnecessarily." },
        { level: "C1", text: "You should speak with the manager first, before the issue becomes harder to untangle." },
      ],
      evaluationRubric: {
        requiredTokens: ["should", "speak"],
        errorTag: "modal_form",
        commonSlip: "Adding to after a modal verb.",
        severity: "medium",
      },
    },
    {
      prompt: "Use these ideas in one sentence: can, solve, together.",
      promptType: "guided_generation",
      structureKey: "modals",
      levelBand: "B1",
      supportObjective: "Express ability and confidence in a natural sentence.",
      topic: "teamwork",
      memoryAnchor: false,
      acceptedAnswer: "We can solve this together.",
      whyItWorks: "Can expresses present ability in a direct, natural way.",
      hint1: "Use the modal to show ability.",
      hint2: "Keep the main verb in base form.",
      naturalRewrite: "We can solve this together if we stay calm and divide the work properly.",
      levelUpVariants: [
        { level: "B1", text: "We can solve this together." },
        { level: "B2", text: "We can solve this together if we stay calm and divide the work properly." },
        { level: "C1", text: "We can solve this together, provided that we stay calm and handle the work strategically." },
      ],
      evaluationRubric: {
        requiredTokens: ["can", "solve", "together"],
        errorTag: "modal_ability",
        commonSlip: "Changing the main verb form after a modal.",
        severity: "low",
      },
    },
  ],
  conditionals: [
    {
      prompt: "Complete the sentence naturally: If I had more time this month, I ____ a longer reading routine.",
      promptType: "completion",
      structureKey: "conditionals",
      levelBand: "B2",
      supportObjective: "Expand flexible sentence building.",
      topic: "habits",
      memoryAnchor: false,
      acceptedAnswer: "If I had more time this month, I would build a longer reading routine.",
      whyItWorks: "The sentence uses the second conditional to express an unreal present situation.",
      hint1: "This is imaginary, not real.",
      hint2: "Use would in the main clause.",
      naturalRewrite: "If I had more time this month, I would build a longer reading routine and stick to it properly.",
      levelUpVariants: [
        { level: "B2", text: "If I had more time this month, I would build a longer reading routine." },
        { level: "C1", text: "If I had more time this month, I would build a longer reading routine and treat it like a fixed appointment." },
        { level: "C1", text: "If I had more time this month, I would build a longer reading routine, which would probably sharpen my focus as well." },
      ],
      evaluationRubric: {
        requiredTokens: ["if", "had", "would"],
        errorTag: "conditional_form",
        commonSlip: "Mixing real and unreal conditional patterns.",
        severity: "high",
      },
    },
    {
      prompt: "Rewrite this naturally: If I will see her later, I tell her the update.",
      promptType: "rewrite",
      structureKey: "conditionals",
      levelBand: "B2",
      supportObjective: "Control first conditional form.",
      topic: "updates",
      memoryAnchor: false,
      acceptedAnswer: "If I see her later, I will tell her the update.",
      whyItWorks: "The if-clause uses present simple, while the result clause uses will.",
      hint1: "Do not use will in both clauses.",
      hint2: "Keep the if-clause in present simple.",
      naturalRewrite: "If I see her later, I will tell her the update immediately.",
      levelUpVariants: [
        { level: "B2", text: "If I see her later, I will tell her the update." },
        { level: "C1", text: "If I see her later, I will tell her the update immediately so there is no confusion." },
        { level: "C1", text: "If I see her later, I will tell her the update immediately, which should keep the project moving cleanly." },
      ],
      evaluationRubric: {
        requiredTokens: ["if", "see", "will", "tell"],
        errorTag: "conditional_form",
        commonSlip: "Using will inside the if-clause.",
        severity: "high",
      },
    },
    {
      prompt: "Write one sentence about a better version of your routine using if.",
      promptType: "memory_anchor",
      structureKey: "conditionals",
      levelBand: "B2",
      supportObjective: "Use hypothetical meaning in a personal context.",
      topic: "routine",
      memoryAnchor: true,
      acceptedAnswer: "If I woke up earlier, I would study before work.",
      whyItWorks: "The sentence expresses an unreal present change and its imagined result.",
      hint1: "Think of a change that is not true now.",
      hint2: "Use if + past simple, then would + base verb.",
      naturalRewrite: "If I woke up earlier, I would study before work and feel much calmer for the rest of the day.",
      levelUpVariants: [
        { level: "B2", text: "If I woke up earlier, I would study before work." },
        { level: "C1", text: "If I woke up earlier, I would study before work and start the day with far more clarity." },
        { level: "C1", text: "If I woke up earlier, I would study before work, which would probably change the tone of my whole day." },
      ],
      evaluationRubric: {
        requiredTokens: ["if", "would"],
        errorTag: "conditional_meaning",
        commonSlip: "Avoiding the conditional shape or missing would.",
        severity: "medium",
      },
    },
    {
      prompt: "Correct the error: If I would know the answer, I told you already.",
      promptType: "error_correction",
      structureKey: "conditionals",
      levelBand: "B2",
      supportObjective: "Avoid the most common conditional misbuilds.",
      topic: "communication",
      memoryAnchor: false,
      acceptedAnswer: "If I knew the answer, I would tell you already.",
      whyItWorks: "Would belongs in the main clause, while the if-clause takes a past form.",
      hint1: "Would is in the wrong clause.",
      hint2: "Move would to the result clause and use a past form after if.",
      naturalRewrite: "If I knew the answer, I would tell you already instead of guessing.",
      levelUpVariants: [
        { level: "B2", text: "If I knew the answer, I would tell you already." },
        { level: "C1", text: "If I knew the answer, I would tell you already instead of letting the uncertainty drag on." },
        { level: "C1", text: "If I knew the answer, I would tell you already, rather than making you wait through the uncertainty." },
      ],
      evaluationRubric: {
        requiredTokens: ["if", "knew", "would", "tell"],
        errorTag: "conditional_clause_order",
        commonSlip: "Putting would in the if-clause.",
        severity: "high",
      },
    },
    {
      prompt: "Use these words in one sentence: missed, train, would, meeting.",
      promptType: "constraint_based",
      structureKey: "conditionals",
      levelBand: "B2",
      supportObjective: "Control cause and consequence in one complex sentence.",
      topic: "travel",
      memoryAnchor: false,
      acceptedAnswer: "If I missed the train, I would miss the meeting.",
      whyItWorks: "The sentence keeps the hypothetical cause-and-result pattern consistent.",
      hint1: "Build a clear if-clause first.",
      hint2: "The second clause should use would.",
      naturalRewrite: "If I missed the train, I would miss the meeting and throw the whole plan off course.",
      levelUpVariants: [
        { level: "B2", text: "If I missed the train, I would miss the meeting." },
        { level: "C1", text: "If I missed the train, I would miss the meeting and derail the whole plan for the day." },
        { level: "C1", text: "If I missed the train, I would miss the meeting, which would put the entire day under pressure." },
      ],
      evaluationRubric: {
        requiredTokens: ["if", "missed", "would", "meeting"],
        errorTag: "conditional_meaning",
        commonSlip: "Losing the hypothetical pattern under constraint.",
        severity: "medium",
      },
    },
  ],
  "relative-clauses": [
    {
      prompt: "Combine these ideas in one sentence: I have a friend. She never misses her morning run.",
      promptType: "rewrite",
      structureKey: "relative-clauses",
      levelBand: "B2",
      supportObjective: "Combine ideas smoothly.",
      topic: "friend",
      memoryAnchor: false,
      acceptedAnswer: "I have a friend who never misses her morning run.",
      whyItWorks: "The relative clause adds detail without forcing a second full sentence.",
      hint1: "Use a relative pronoun after friend.",
      hint2: "Attach the second idea directly to the noun with who.",
      naturalRewrite: "I have a friend who never misses her morning run, even on busy days.",
      levelUpVariants: [
        { level: "B2", text: "I have a friend who never misses her morning run." },
        { level: "C1", text: "I have a friend who never misses her morning run, which says a lot about her discipline." },
        { level: "C1", text: "I have a friend who never misses her morning run, even when the rest of us are still half asleep." },
      ],
      evaluationRubric: {
        requiredTokens: ["friend", "who"],
        errorTag: "relative_clause_control",
        commonSlip: "Leaving the ideas as two separate sentences.",
        severity: "medium",
      },
    },
    {
      prompt: "Write one sentence about a place you love using a relative clause.",
      promptType: "memory_anchor",
      structureKey: "relative-clauses",
      levelBand: "B2",
      supportObjective: "Add descriptive detail without losing control.",
      topic: "travel",
      memoryAnchor: true,
      acceptedAnswer: "I love the cafe that stays open late near my apartment.",
      whyItWorks: "That introduces a defining clause which makes the noun more specific.",
      hint1: "Attach extra information directly to the noun.",
      hint2: "Use who, that, or which to connect the details.",
      naturalRewrite: "I love the cafe that stays open late near my apartment, because it feels calm when the city slows down.",
      levelUpVariants: [
        { level: "B2", text: "I love the cafe that stays open late near my apartment." },
        { level: "C1", text: "I love the cafe that stays open late near my apartment, because it gives the neighborhood a quieter kind of life." },
        { level: "C1", text: "I love the cafe that stays open late near my apartment, which has become my favorite place to clear my head." },
      ],
      evaluationRubric: {
        requiredTokens: ["that"],
        errorTag: "relative_clause_control",
        commonSlip: "Adding detail in a separate sentence instead of building a clause.",
        severity: "medium",
      },
    },
    {
      prompt: "Correct the error: The book who changed my thinking was difficult at first.",
      promptType: "error_correction",
      structureKey: "relative-clauses",
      levelBand: "B2",
      supportObjective: "Match the relative pronoun to the noun.",
      topic: "reading",
      memoryAnchor: false,
      acceptedAnswer: "The book that changed my thinking was difficult at first.",
      whyItWorks: "Who refers to people, while that or which can refer to things.",
      hint1: "The relative pronoun does not match the noun.",
      hint2: "This noun is a thing, not a person.",
      naturalRewrite: "The book that changed my thinking was difficult at first, but it stayed with me long after I finished it.",
      levelUpVariants: [
        { level: "B2", text: "The book that changed my thinking was difficult at first." },
        { level: "C1", text: "The book that changed my thinking was difficult at first, but its ideas stayed with me." },
        { level: "C1", text: "The book that changed my thinking was difficult at first, yet it ended up reshaping how I look at the subject." },
      ],
      evaluationRubric: {
        requiredTokens: ["book", "that"],
        errorTag: "relative_pronoun_choice",
        commonSlip: "Using who with things.",
        severity: "medium",
      },
    },
    {
      prompt: "Use these ideas in one sentence: colleague, always helps, calm under pressure.",
      promptType: "guided_generation",
      structureKey: "relative-clauses",
      levelBand: "B2",
      supportObjective: "Embed description inside one sentence.",
      topic: "work",
      memoryAnchor: false,
      acceptedAnswer: "I have a colleague who always helps me stay calm under pressure.",
      whyItWorks: "The clause gives defining information about the colleague and keeps the sentence flowing.",
      hint1: "Turn the second idea into a clause linked to colleague.",
      hint2: "Use who because the noun is a person.",
      naturalRewrite: "I have a colleague who always helps me stay calm under pressure, which makes difficult days far easier to manage.",
      levelUpVariants: [
        { level: "B2", text: "I have a colleague who always helps me stay calm under pressure." },
        { level: "C1", text: "I have a colleague who always helps me stay calm under pressure, which makes difficult days much easier to manage." },
        { level: "C1", text: "I have a colleague who always helps me stay calm under pressure, and that steady influence matters more than she knows." },
      ],
      evaluationRubric: {
        requiredTokens: ["colleague", "who"],
        errorTag: "relative_clause_control",
        commonSlip: "Keeping the ideas apart instead of embedding the detail.",
        severity: "medium",
      },
    },
    {
      prompt: "Complete the sentence naturally: The app ____ I use every morning helps me plan my day.",
      promptType: "completion",
      structureKey: "relative-clauses",
      levelBand: "B2",
      supportObjective: "Use a compact defining clause.",
      topic: "apps",
      memoryAnchor: false,
      acceptedAnswer: "The app that I use every morning helps me plan my day.",
      whyItWorks: "That introduces the defining clause and clarifies which app you mean.",
      hint1: "You need a connector between app and I use every morning.",
      hint2: "Use a relative pronoun that fits a thing.",
      naturalRewrite: "The app that I use every morning helps me plan my day before anything starts to drift.",
      levelUpVariants: [
        { level: "B2", text: "The app that I use every morning helps me plan my day." },
        { level: "C1", text: "The app that I use every morning helps me plan my day before the noise of the day takes over." },
        { level: "C1", text: "The app that I use every morning helps me plan my day, which keeps me from reacting to everything at once." },
      ],
      evaluationRubric: {
        requiredTokens: ["app", "that", "use"],
        errorTag: "relative_clause_control",
        commonSlip: "Leaving a gap where the relative connector should be.",
        severity: "medium",
      },
    },
  ],
  connectors: [
    {
      prompt: "Upgrade this sentence to a smoother B2 version: I was tired, but I finished the project.",
      promptType: "rewrite",
      structureKey: "connectors",
      levelBand: "B2",
      supportObjective: "Improve coherence.",
      topic: "work",
      memoryAnchor: false,
      acceptedAnswer: "Although I was tired, I finished the project.",
      whyItWorks: "Although creates a tighter and more flexible relationship between the ideas.",
      hint1: "Use a stronger connector than but.",
      hint2: "Start the sentence with although.",
      naturalRewrite: "Although I was tired, I finished the project because the deadline could not move.",
      levelUpVariants: [
        { level: "B2", text: "Although I was tired, I finished the project." },
        { level: "C1", text: "Although I was tired, I finished the project because the deadline could not move." },
        { level: "C1", text: "Although I was tired, I finished the project, knowing that delaying it would only create more pressure." },
      ],
      evaluationRubric: {
        requiredTokens: ["although", "finished", "project"],
        errorTag: "connector_variety",
        commonSlip: "Relying on basic coordination when a connector would create cleaner flow.",
        severity: "medium",
      },
    },
    {
      prompt: "Write one sentence about two opposite feelings using a connector.",
      promptType: "memory_anchor",
      structureKey: "connectors",
      levelBand: "B2",
      supportObjective: "Link contrast clearly in a personal context.",
      topic: "feelings",
      memoryAnchor: true,
      acceptedAnswer: "Although I felt nervous, I was also excited to start.",
      whyItWorks: "The connector makes the contrast clear without splitting the idea.",
      hint1: "Use one connector to show contrast.",
      hint2: "Try although, while, or even though.",
      naturalRewrite: "Although I felt nervous, I was also excited to start because the chance meant a lot to me.",
      levelUpVariants: [
        { level: "B2", text: "Although I felt nervous, I was also excited to start." },
        { level: "C1", text: "Although I felt nervous, I was also excited to start, which made the moment strangely energizing." },
        { level: "C1", text: "Although I felt nervous, I was also excited to start, since the opportunity mattered too much to ignore." },
      ],
      evaluationRubric: {
        requiredTokens: ["although"],
        errorTag: "connector_variety",
        commonSlip: "Keeping contrasting ideas in separate basic clauses.",
        severity: "medium",
      },
    },
    {
      prompt: "Correct the error: Because the weather was bad, but we still went outside.",
      promptType: "error_correction",
      structureKey: "connectors",
      levelBand: "B2",
      supportObjective: "Avoid connector overload.",
      topic: "weather",
      memoryAnchor: false,
      acceptedAnswer: "Although the weather was bad, we still went outside.",
      whyItWorks: "One connector is enough. Using both because and but overloads the sentence.",
      hint1: "Two connectors are fighting each other.",
      hint2: "Keep one connector and rebuild the sentence cleanly.",
      naturalRewrite: "Although the weather was bad, we still went outside because we had already planned the trip.",
      levelUpVariants: [
        { level: "B2", text: "Although the weather was bad, we still went outside." },
        { level: "C1", text: "Although the weather was bad, we still went outside because cancelling felt worse." },
        { level: "C1", text: "Although the weather was bad, we still went outside, since the plan mattered more than the discomfort." },
      ],
      evaluationRubric: {
        requiredTokens: ["although", "outside"],
        errorTag: "connector_overload",
        commonSlip: "Combining connectors that create broken logic.",
        severity: "high",
      },
    },
    {
      prompt: "Complete the sentence naturally: I wanted to leave early; however, ____.",
      promptType: "completion",
      structureKey: "connectors",
      levelBand: "B2",
      supportObjective: "Use formal connectors naturally.",
      topic: "meetings",
      memoryAnchor: false,
      acceptedAnswer: "I wanted to leave early; however, the meeting kept going.",
      whyItWorks: "However signals contrast with a slightly more formal tone.",
      hint1: "Use a contrasting idea after however.",
      hint2: "The second clause should block the first plan.",
      naturalRewrite: "I wanted to leave early; however, the meeting kept going and the conversation still needed me there.",
      levelUpVariants: [
        { level: "B2", text: "I wanted to leave early; however, the meeting kept going." },
        { level: "C1", text: "I wanted to leave early; however, the meeting kept going and I still needed to contribute." },
        { level: "C1", text: "I wanted to leave early; however, the meeting kept going, and leaving would have looked careless." },
      ],
      evaluationRubric: {
        requiredTokens: ["however"],
        errorTag: "connector_usage",
        commonSlip: "Using however without a real contrast or clean clause after it.",
        severity: "medium",
      },
    },
    {
      prompt: "Use these ideas in one sentence: stayed calm, problem was serious.",
      promptType: "guided_generation",
      structureKey: "connectors",
      levelBand: "B2",
      supportObjective: "Build fluent contrast under constraint.",
      topic: "pressure",
      memoryAnchor: false,
      acceptedAnswer: "Even though the problem was serious, she stayed calm.",
      whyItWorks: "Even though creates a strong contrast while keeping the sentence compact.",
      hint1: "Use a connector of concession.",
      hint2: "Try even though to connect the pressure and the calm reaction.",
      naturalRewrite: "Even though the problem was serious, she stayed calm and kept everyone focused.",
      levelUpVariants: [
        { level: "B2", text: "Even though the problem was serious, she stayed calm." },
        { level: "C1", text: "Even though the problem was serious, she stayed calm and kept everyone focused." },
        { level: "C1", text: "Even though the problem was serious, she stayed calm, which stopped the rest of the team from spiraling." },
      ],
      evaluationRubric: {
        requiredTokens: ["even", "though"],
        errorTag: "connector_variety",
        commonSlip: "Defaulting to but instead of building a more flexible clause.",
        severity: "medium",
      },
    },
  ],
  "sentence-combining": [
    {
      prompt: "Which sentence combines the two ideas more smoothly?",
      promptType: "rewrite",
      interactionType: "hybrid_choice_text",
      choiceOptions: [
        {
          id: "A",
          text: "Although I was busy, I still answered the message.",
        },
        {
          id: "B",
          text: "I was busy. I still answered the message.",
        },
      ],
      correctChoiceId: "A",
      choiceFeedbackByOption: {
        B: {
          whatWentWrong:
            "The ideas stay in two short clauses, so the relationship still feels flat.",
          why: "This task wants one smoother sentence, not two separate statements.",
          whatFitsInstead:
            'Choose the version that uses a connector to merge the ideas into one sentence.',
        },
      },
      followUpPrompt: "Rewrite only the smoother sentence exactly before you continue.",
      followUpPromptType: "rewrite",
      followUpMode: "exact_rewrite",
      followUpAcceptedAnswer: "Although I was busy, I still answered the message.",
      followUpWhyItWorks:
        "You turned the contrast into one sentence with clearer flow.",
      followUpHint1: "Keep one connector and one main clause.",
      followUpHint2: "Use although to make one idea dependent and keep the action in the main clause.",
      followUpNaturalRewrite:
        "Although I was busy, I still answered the message because I knew it was urgent.",
      followUpLevelUpVariants: [
        { level: "B1", text: "Although I was busy, I still answered the message." },
        { level: "B2", text: "Although I was busy, I still answered the message because I knew it was urgent." },
        { level: "C1", text: "Although I was busy, I still answered the message, since delaying it would only have created more confusion." },
      ],
      followUpEvaluationRubric: {
        requiredTokens: ["although"],
        errorTag: "sentence_combining",
        commonSlip: "Keeping connected ideas in short separate clauses.",
        severity: "medium",
      },
      structureKey: "sentence-combining",
      levelBand: "B1",
      supportObjective: "Raise sentence complexity.",
      topic: "messages",
      memoryAnchor: false,
      acceptedAnswer: "Although I was busy, I still answered the message.",
      whyItWorks: "The combined sentence carries the same meaning with stronger flow.",
      hint1: "Use one connector to merge the ideas.",
      hint2: "Make one idea dependent and keep the main action in the main clause.",
      naturalRewrite: "Although I was busy, I still answered the message because I knew it was urgent.",
      levelUpVariants: [
        { level: "B1", text: "Although I was busy, I still answered the message." },
        { level: "B2", text: "Although I was busy, I still answered the message because I knew it was urgent." },
        { level: "C1", text: "Although I was busy, I still answered the message, since delaying it would only have created more confusion." },
      ],
      evaluationRubric: {
        requiredTokens: ["although"],
        errorTag: "sentence_combining",
        commonSlip: "Keeping connected ideas in short separate clauses.",
        severity: "medium",
      },
    },
    {
      prompt: "Write one sentence about your day using because or while to connect two ideas.",
      promptType: "memory_anchor",
      structureKey: "sentence-combining",
      levelBand: "B1",
      supportObjective: "Stretch from short clauses to a fuller sentence.",
      topic: "daily life",
      memoryAnchor: true,
      acceptedAnswer: "I studied at home because the library was full.",
      whyItWorks: "The sentence connects cause and result in one natural structure.",
      hint1: "Take two simple ideas and connect them.",
      hint2: "Because is an easy starting point for sentence combining.",
      naturalRewrite: "I studied at home because the library was full, which turned out to be calmer than I expected.",
      levelUpVariants: [
        { level: "B1", text: "I studied at home because the library was full." },
        { level: "B2", text: "I studied at home because the library was full, and the quiet ended up helping me focus." },
        { level: "C1", text: "I studied at home because the library was full, and that unexpected change actually made it easier to concentrate." },
      ],
      evaluationRubric: {
        requiredTokens: ["because"],
        errorTag: "sentence_combining",
        commonSlip: "Writing two short ideas without connecting logic.",
        severity: "medium",
      },
    },
    {
      prompt: "Correct the error: I was late. Because the bus was delayed.",
      promptType: "error_correction",
      structureKey: "sentence-combining",
      levelBand: "B1",
      supportObjective: "Avoid sentence fragments while combining ideas.",
      topic: "travel",
      memoryAnchor: false,
      acceptedAnswer: "I was late because the bus was delayed.",
      whyItWorks: "The cause clause is attached to the main clause, so the sentence is complete.",
      hint1: "One part is a fragment, not a full sentence.",
      hint2: "Attach the because clause to the main idea.",
      naturalRewrite: "I was late because the bus was delayed, which threw off the rest of the morning.",
      levelUpVariants: [
        { level: "B1", text: "I was late because the bus was delayed." },
        { level: "B2", text: "I was late because the bus was delayed, and the delay affected the rest of the morning." },
        { level: "C1", text: "I was late because the bus was delayed, and that small delay ended up disrupting the whole morning." },
      ],
      evaluationRubric: {
        requiredTokens: ["because", "bus", "delayed"],
        errorTag: "sentence_fragment",
        commonSlip: "Leaving a dependent clause as a separate fragment.",
        severity: "high",
      },
    },
    {
      prompt: "Complete the sentence naturally: I stayed online longer ____ I still had two questions to ask.",
      promptType: "completion",
      structureKey: "sentence-combining",
      levelBand: "B1",
      supportObjective: "Use a simple logical connector with control.",
      topic: "study",
      memoryAnchor: false,
      acceptedAnswer: "I stayed online longer because I still had two questions to ask.",
      whyItWorks: "Because clearly joins the action with its reason.",
      hint1: "You need a connector of reason.",
      hint2: "Because fits the logic cleanly.",
      naturalRewrite: "I stayed online longer because I still had two questions to ask, and I did not want to lose the chance.",
      levelUpVariants: [
        { level: "B1", text: "I stayed online longer because I still had two questions to ask." },
        { level: "B2", text: "I stayed online longer because I still had two questions to ask, and the chance to clarify them felt too useful to lose." },
        { level: "C1", text: "I stayed online longer because I still had two questions to ask, and leaving without clarity would have slowed me down later." },
      ],
      evaluationRubric: {
        requiredTokens: ["because"],
        errorTag: "sentence_combining",
        commonSlip: "Missing the connector that shows the relationship between the clauses.",
        severity: "medium",
      },
    },
    {
      prompt: "Use these ideas in one sentence: practice, every day, improve gradually.",
      promptType: "guided_generation",
      structureKey: "sentence-combining",
      levelBand: "B1",
      supportObjective: "Build a longer idea from a simple proposition.",
      topic: "practice",
      memoryAnchor: false,
      acceptedAnswer: "If you practice every day, you improve gradually.",
      whyItWorks: "The combined sentence gives a clearer logical relationship than two separate short statements.",
      hint1: "Turn one idea into the condition for the other.",
      hint2: "If is a simple way to connect these two thoughts.",
      naturalRewrite: "If you practice every day, you improve gradually, even when the change feels slow at first.",
      levelUpVariants: [
        { level: "B1", text: "If you practice every day, you improve gradually." },
        { level: "B2", text: "If you practice every day, you improve gradually, even when the change feels slow at first." },
        { level: "C1", text: "If you practice every day, you improve gradually, which is why consistency matters more than occasional intensity." },
      ],
      evaluationRubric: {
        requiredTokens: ["if", "practice", "improve"],
        errorTag: "sentence_combining",
        commonSlip: "Leaving related ideas disconnected.",
        severity: "medium",
      },
    },
  ],
  "reported-speech": [
    {
      prompt: 'Rewrite this in reported speech: Maya said, "I can\'t come today."',
      promptType: "rewrite",
      contentSource: "authored_bank",
      feedbackStrategy: "reported_speech",
      groundingTargets: ["said", "couldn't", "that day"],
      allowOpenProduction: false,
      structureKey: "reported-speech",
      levelBand: "B2",
      supportObjective: "Control tense shifts in reporting.",
      topic: "reporting",
      memoryAnchor: false,
      acceptedAnswer: "Maya said that she couldn't come that day.",
      whyItWorks: "The sentence backshifts the modal and adjusts the time word to fit reported speech.",
      hint1: "Shift the tense and the time word so the report sounds natural after the moment has passed.",
      hint2: "Try couldn't and that day instead of the direct quote wording.",
      naturalRewrite: "Maya said that she couldn't come that day because she was still at work.",
      levelUpVariants: [
        { level: "B2", text: "Maya said that she couldn't come that day." },
        { level: "C1", text: "Maya said that she couldn't come that day because she was still at work." },
        { level: "C1", text: "Maya said that she couldn't come that day, so we moved the plan to later in the week." },
      ],
      evaluationRubric: {
        requiredTokens: ["said", "couldn't", "that", "day"],
        errorTag: "reported_speech_time_shift",
        commonSlip: "Keeping the direct quote too close to the original wording.",
        severity: "high",
      },
    },
    {
      prompt: "Which reported sentence is more natural?",
      promptType: "rewrite",
      contentSource: "authored_bank",
      feedbackStrategy: "reported_speech",
      groundingTargets: ["told me"],
      allowOpenProduction: false,
      interactionType: "hybrid_choice_text",
      choiceOptions: [
        { id: "A", text: "The coach told me that I needed more sleep." },
        { id: "B", text: "The coach told that I needed more sleep." },
      ],
      correctChoiceId: "A",
      choiceFeedbackByOption: {
        B: {
          whatWentWrong: 'The reporting verb is close, but "told" normally needs an object like "me" or "us".',
          why: 'English says "told me/us/him", not "told that" on its own.',
          whatFitsInstead:
            'Choose "The coach told me that I needed more sleep." to keep the reporting frame natural.',
        },
      },
      followUpPrompt: "Rewrite only the better sentence exactly before moving on.",
      followUpPromptType: "rewrite",
      followUpMode: "exact_rewrite",
      followUpAcceptedAnswer: "The coach told me that I needed more sleep.",
      followUpWhyItWorks: 'The sentence uses "told" with the object it needs.',
      followUpHint1: 'Keep the object after "told".',
      followUpHint2: 'Write the full frame: "told me that..."',
      followUpNaturalRewrite:
        "The coach told me that I needed more sleep before the next match.",
      followUpLevelUpVariants: [
        { level: "B2", text: "The coach told me that I needed more sleep." },
        { level: "C1", text: "The coach told me that I needed more sleep before the next match." },
        { level: "C1", text: "The coach told me that I needed more sleep, which was hard to ignore after that week." },
      ],
      followUpEvaluationRubric: {
        requiredTokens: ["told", "me"],
        errorTag: "reported_speech_told_frame",
        commonSlip: 'Using "told" without the object it requires.',
        severity: "high",
      },
      structureKey: "reported-speech",
      levelBand: "B2",
      supportObjective: "Control tense shifts in reporting.",
      topic: "reporting",
      memoryAnchor: false,
      acceptedAnswer: "The coach told me that I needed more sleep.",
      whyItWorks: 'The reporting frame is complete because "told" takes an object.',
      hint1: 'Keep the object after "told".',
      hint2: 'Write the full frame: "told me that..."',
      naturalRewrite: "The coach told me that I needed more sleep before the next match.",
      levelUpVariants: [
        { level: "B2", text: "The coach told me that I needed more sleep." },
        { level: "C1", text: "The coach told me that I needed more sleep before the next match." },
        { level: "C1", text: "The coach told me that I needed more sleep, which finally made me slow down." },
      ],
      evaluationRubric: {
        requiredTokens: ["told", "me"],
        errorTag: "reported_speech_told_frame",
        commonSlip: 'Using "told" without the object it requires.',
        severity: "high",
      },
    },
    {
      prompt: "Correct the reported sentence: Sara said that she will finish it tomorrow.",
      promptType: "error_correction",
      contentSource: "authored_bank",
      feedbackStrategy: "reported_speech",
      groundingTargets: ["would", "the next day"],
      allowOpenProduction: false,
      structureKey: "reported-speech",
      levelBand: "B2",
      supportObjective: "Control tense shifts in reporting.",
      topic: "reporting",
      memoryAnchor: false,
      acceptedAnswer: "Sara said that she would finish it the next day.",
      whyItWorks: "Reported speech shifts both the future form and the time marker.",
      hint1: "Adjust the future form and the time word together.",
      hint2: 'Try "would" and "the next day".',
      naturalRewrite: "Sara said that she would finish it the next day, so I stopped waiting for it that evening.",
      levelUpVariants: [
        { level: "B2", text: "Sara said that she would finish it the next day." },
        { level: "C1", text: "Sara said that she would finish it the next day, so I stopped waiting for it that evening." },
        { level: "C1", text: "Sara said that she would finish it the next day, which gave the rest of us a clearer timeline." },
      ],
      evaluationRubric: {
        requiredTokens: ["would", "next", "day"],
        errorTag: "reported_speech_time_shift",
        commonSlip: "Keeping direct-speech future or time words unchanged.",
        severity: "high",
      },
    },
    {
      prompt: "Use these ideas in one sentence: told, me, meeting, earlier.",
      promptType: "guided_generation",
      contentSource: "authored_bank",
      feedbackStrategy: "reported_speech",
      groundingTargets: ["told me", "earlier"],
      allowOpenProduction: false,
      structureKey: "reported-speech",
      levelBand: "B2",
      supportObjective: "Control tense shifts in reporting.",
      topic: "meetings",
      memoryAnchor: false,
      acceptedAnswer: "He told me that the meeting was earlier than we expected.",
      whyItWorks: "The sentence reports information smoothly with a natural told-me frame.",
      hint1: 'Keep "told me" together and turn the ideas into one report.',
      hint2: 'Use one clean reported sentence instead of listing the words.',
      naturalRewrite: "He told me that the meeting was earlier than we expected, so I had to leave the house sooner.",
      levelUpVariants: [
        { level: "B2", text: "He told me that the meeting was earlier than we expected." },
        { level: "C1", text: "He told me that the meeting was earlier than we expected, so I had to rearrange the morning." },
        { level: "C1", text: "He told me that the meeting was earlier than we expected, which completely changed the pace of the day." },
      ],
      evaluationRubric: {
        requiredTokens: ["told", "me", "meeting", "earlier"],
        errorTag: "reported_speech_told_frame",
        commonSlip: "Breaking the reporting frame instead of turning the ideas into one usable sentence.",
        severity: "medium",
      },
    },
    {
      prompt: 'Rewrite this question in reported speech: He asked, "Did you send the file already?"',
      promptType: "rewrite",
      contentSource: "authored_bank",
      feedbackStrategy: "reported_speech",
      groundingTargets: ["asked whether", "had sent"],
      allowOpenProduction: false,
      structureKey: "reported-speech",
      levelBand: "B2",
      supportObjective: "Control tense shifts in reporting.",
      topic: "questions",
      memoryAnchor: false,
      acceptedAnswer: "He asked whether I had sent the file already.",
      whyItWorks: "Reported questions need statement word order and often backshift the tense.",
      hint1: 'Use "asked whether" and change the question to statement order.',
      hint2: 'Try "had sent" instead of the direct question form.',
      naturalRewrite: "He asked whether I had sent the file already because he needed it before lunch.",
      levelUpVariants: [
        { level: "B2", text: "He asked whether I had sent the file already." },
        { level: "C1", text: "He asked whether I had sent the file already because the client was waiting for it." },
        { level: "C1", text: "He asked whether I had sent the file already, which made it clear how urgent the situation had become." },
      ],
      evaluationRubric: {
        requiredTokens: ["asked", "whether", "had", "sent"],
        errorTag: "reported_speech_question_form",
        commonSlip: "Keeping direct-question order inside a reported question.",
        severity: "high",
      },
    },
  ],
  "passive-voice": [
    {
      prompt: "Rewrite this naturally in the passive: The team finished the report yesterday.",
      promptType: "rewrite",
      structureKey: "passive-voice",
      levelBand: "B2",
      supportObjective: "Handle more formal structures.",
      topic: "reports",
      memoryAnchor: false,
      acceptedAnswer: "The report was finished yesterday.",
      whyItWorks: "Passive voice shifts focus to the result instead of the doer.",
      hint1: "Move the object into the subject position.",
      hint2: "Use was plus the past participle.",
      naturalRewrite: "The report was finished yesterday, so the next stage can begin today.",
      levelUpVariants: [
        { level: "B2", text: "The report was finished yesterday." },
        { level: "C1", text: "The report was finished yesterday, which means the team can move forward today without delay." },
        { level: "C1", text: "The report was finished yesterday, allowing the next phase to begin on a cleaner footing." },
      ],
      evaluationRubric: {
        requiredTokens: ["report", "was", "finished"],
        errorTag: "passive_voice",
        commonSlip: "Keeping the active structure when the task needs passive focus.",
        severity: "medium",
      },
    },
    {
      prompt: "Correct the error: The plan was approve last week.",
      promptType: "error_correction",
      structureKey: "passive-voice",
      levelBand: "B2",
      supportObjective: "Use the participle correctly in passive forms.",
      topic: "planning",
      memoryAnchor: false,
      acceptedAnswer: "The plan was approved last week.",
      whyItWorks: "Passive voice needs be plus a past participle.",
      hint1: "The verb form after was is wrong.",
      hint2: "Use the past participle, not the base form.",
      naturalRewrite: "The plan was approved last week, so the team can stop waiting for a final decision.",
      levelUpVariants: [
        { level: "B2", text: "The plan was approved last week." },
        { level: "C1", text: "The plan was approved last week, which removed a major source of uncertainty." },
        { level: "C1", text: "The plan was approved last week, finally giving the team the clarity it had been waiting for." },
      ],
      evaluationRubric: {
        requiredTokens: ["plan", "was", "approved"],
        errorTag: "passive_participle",
        commonSlip: "Using the wrong verb form in a passive structure.",
        severity: "high",
      },
    },
    {
      prompt: "Write one sentence about a rule in your workplace or school using passive voice.",
      promptType: "memory_anchor",
      structureKey: "passive-voice",
      levelBand: "B2",
      supportObjective: "Use passive voice naturally in policy-style statements.",
      topic: "rules",
      memoryAnchor: true,
      acceptedAnswer: "Phones are not allowed during the exam.",
      whyItWorks: "Passive voice keeps the focus on the rule rather than the people enforcing it.",
      hint1: "Focus on the rule, not the person.",
      hint2: "Use be plus a past participle like allowed or required.",
      naturalRewrite: "Phones are not allowed during the exam, which keeps the room calmer and fairer for everyone.",
      levelUpVariants: [
        { level: "B2", text: "Phones are not allowed during the exam." },
        { level: "C1", text: "Phones are not allowed during the exam, which helps preserve both calm and fairness." },
        { level: "C1", text: "Phones are not allowed during the exam, a rule that removes unnecessary distractions from the room." },
      ],
      evaluationRubric: {
        requiredTokens: ["are", "allowed"],
        errorTag: "passive_policy_style",
        commonSlip: "Defaulting to active voice when passive sounds more natural.",
        severity: "medium",
      },
    },
    {
      prompt: "Complete the sentence naturally: All applications ____ by Friday afternoon.",
      promptType: "completion",
      structureKey: "passive-voice",
      levelBand: "B2",
      supportObjective: "Control passive form under time pressure.",
      topic: "applications",
      memoryAnchor: false,
      acceptedAnswer: "All applications must be submitted by Friday afternoon.",
      whyItWorks: "The passive keeps the focus on the applications and fits formal instruction well.",
      hint1: "You need a passive form after the modal.",
      hint2: "Use be plus the past participle.",
      naturalRewrite: "All applications must be submitted by Friday afternoon if you want to be considered in the first round.",
      levelUpVariants: [
        { level: "B2", text: "All applications must be submitted by Friday afternoon." },
        { level: "C1", text: "All applications must be submitted by Friday afternoon if candidates want to be considered in the first round." },
        { level: "C1", text: "All applications must be submitted by Friday afternoon, otherwise they will be pushed into the next review cycle." },
      ],
      evaluationRubric: {
        requiredTokens: ["must", "be", "submitted"],
        errorTag: "passive_modal_form",
        commonSlip: "Forgetting be after a modal in passive voice.",
        severity: "high",
      },
    },
    {
      prompt: "Use these ideas in one sentence: message, send, morning.",
      promptType: "guided_generation",
      structureKey: "passive-voice",
      levelBand: "B2",
      supportObjective: "Choose passive voice when the actor is less important.",
      topic: "messages",
      memoryAnchor: false,
      acceptedAnswer: "The message was sent this morning.",
      whyItWorks: "Passive voice fits because the important part is the action and timing, not the sender.",
      hint1: "Focus on the message rather than the person.",
      hint2: "Use was sent.",
      naturalRewrite: "The message was sent this morning, so everyone should have seen the update by now.",
      levelUpVariants: [
        { level: "B2", text: "The message was sent this morning." },
        { level: "C1", text: "The message was sent this morning, so the update should already be in circulation." },
        { level: "C1", text: "The message was sent this morning, which means the delay can no longer be blamed on missing information." },
      ],
      evaluationRubric: {
        requiredTokens: ["message", "was", "sent", "morning"],
        errorTag: "passive_voice",
        commonSlip: "Keeping the actor when the task asks for result-focused phrasing.",
        severity: "medium",
      },
    },
  ],
  hedging: [
    {
      prompt: "Rewrite this more carefully: This solution is perfect for everyone.",
      promptType: "rewrite",
      structureKey: "hedging",
      levelBand: "C1",
      supportObjective: "Improve nuance and academic tone.",
      topic: "opinions",
      memoryAnchor: false,
      acceptedAnswer: "This solution may work well for many people.",
      whyItWorks: "Hedging makes the claim more precise and realistic.",
      hint1: "Soften the certainty.",
      hint2: "Use may, might, or a phrase like seems to.",
      naturalRewrite: "This solution may work well for many people, although its success probably depends on the context.",
      levelUpVariants: [
        { level: "B2", text: "This solution may work well for many people." },
        { level: "C1", text: "This solution may work well for many people, although its success probably depends on the context." },
        { level: "C1", text: "This solution may work well for many people, but it would be risky to present it as universally effective." },
      ],
      evaluationRubric: {
        requiredTokens: ["may"],
        errorTag: "hedging_precision",
        commonSlip: "Making claims sound absolute when the idea needs caution.",
        severity: "medium",
      },
    },
    {
      prompt: "Write one sentence giving an opinion carefully, not absolutely.",
      promptType: "memory_anchor",
      structureKey: "hedging",
      levelBand: "C1",
      supportObjective: "Express opinions with more control and nuance.",
      topic: "opinions",
      memoryAnchor: true,
      acceptedAnswer: "I would argue that short daily practice is often more effective than rare long sessions.",
      whyItWorks: "The sentence presents a strong view without pretending it is the only truth.",
      hint1: "Use a phrase that softens the opinion slightly.",
      hint2: "Try I would argue, seems to, or tends to.",
      naturalRewrite: "I would argue that short daily practice is often more effective than rare long sessions, at least for most learners.",
      levelUpVariants: [
        { level: "B2", text: "I think short daily practice may be more effective than rare long sessions." },
        { level: "C1", text: "I would argue that short daily practice is often more effective than rare long sessions." },
        { level: "C1", text: "I would argue that short daily practice is often more effective than rare long sessions, particularly when consistency is the real issue." },
      ],
      evaluationRubric: {
        requiredTokens: ["would", "argue"],
        errorTag: "hedging_precision",
        commonSlip: "Presenting an opinion as an unquestionable fact.",
        severity: "medium",
      },
    },
    {
      prompt: "Complete the sentence naturally: It ____ that the team needs clearer priorities.",
      promptType: "completion",
      structureKey: "hedging",
      levelBand: "C1",
      supportObjective: "Use impersonal hedging structures.",
      topic: "work",
      memoryAnchor: false,
      acceptedAnswer: "It seems that the team needs clearer priorities.",
      whyItWorks: "Seems that softens the claim while still sounding confident.",
      hint1: "Use a verb that softens the statement.",
      hint2: "Seems is a strong fit here.",
      naturalRewrite: "It seems that the team needs clearer priorities before any new tasks are added.",
      levelUpVariants: [
        { level: "B2", text: "It seems that the team needs clearer priorities." },
        { level: "C1", text: "It seems that the team needs clearer priorities before any new tasks are added." },
        { level: "C1", text: "It seems that the team needs clearer priorities, otherwise even strong effort will keep getting scattered." },
      ],
      evaluationRubric: {
        requiredTokens: ["seems"],
        errorTag: "hedging_structure",
        commonSlip: "Using absolute phrasing when a softer impersonal frame fits better.",
        severity: "medium",
      },
    },
    {
      prompt: "Correct the tone: This proves the policy is bad.",
      promptType: "error_correction",
      structureKey: "hedging",
      levelBand: "C1",
      supportObjective: "Avoid overclaiming in analytical language.",
      topic: "analysis",
      memoryAnchor: false,
      acceptedAnswer: "This suggests that the policy may be ineffective.",
      whyItWorks: "Suggests and may sound analytical and more defensible than proves and bad.",
      hint1: "Soften both the verb and the evaluation.",
      hint2: "Replace proves with suggests and bad with a more precise adjective.",
      naturalRewrite: "This suggests that the policy may be ineffective, although more evidence would still help clarify the picture.",
      levelUpVariants: [
        { level: "B2", text: "This suggests that the policy may be ineffective." },
        { level: "C1", text: "This suggests that the policy may be ineffective, although more evidence would still help." },
        { level: "C1", text: "This suggests that the policy may be ineffective, though the current evidence is probably not strong enough for a final conclusion." },
      ],
      evaluationRubric: {
        requiredTokens: ["suggests", "may"],
        errorTag: "hedging_precision",
        commonSlip: "Using language that sounds too absolute for limited evidence.",
        severity: "medium",
      },
    },
    {
      prompt: "Use these ideas in one sentence: probably, depends, context.",
      promptType: "guided_generation",
      structureKey: "hedging",
      levelBand: "C1",
      supportObjective: "Blend hedging into one clear sentence.",
      topic: "context",
      memoryAnchor: false,
      acceptedAnswer: "The outcome probably depends on the context.",
      whyItWorks: "The sentence stays concise while still sounding appropriately cautious.",
      hint1: "Use probably to soften the certainty.",
      hint2: "Keep the sentence short and analytical.",
      naturalRewrite: "The outcome probably depends on the context, which is why simple rules rarely work in every case.",
      levelUpVariants: [
        { level: "B2", text: "The outcome probably depends on the context." },
        { level: "C1", text: "The outcome probably depends on the context, which makes easy generalizations unreliable." },
        { level: "C1", text: "The outcome probably depends on the context, which is exactly why one-size-fits-all conclusions often fail." },
      ],
      evaluationRubric: {
        requiredTokens: ["probably", "depends", "context"],
        errorTag: "hedging_structure",
        commonSlip: "Dropping the hedge and making the sentence sound more certain than intended.",
        severity: "low",
      },
    },
  ],
  collocations: [
    {
      prompt: "Correct the error: I did a big mistake in the presentation.",
      promptType: "error_correction",
      structureKey: "collocations",
      levelBand: "B1",
      supportObjective: "Sound more natural.",
      topic: "presentations",
      memoryAnchor: false,
      acceptedAnswer: "I made a big mistake in the presentation.",
      whyItWorks: "Make collocates naturally with mistake.",
      hint1: "The verb is unnatural with mistake.",
      hint2: "Use the verb that usually goes with mistake.",
      naturalRewrite: "I made a big mistake in the presentation, but I recovered before the end.",
      levelUpVariants: [
        { level: "B1", text: "I made a big mistake in the presentation." },
        { level: "B2", text: "I made a big mistake in the presentation, but I recovered before the end." },
        { level: "C1", text: "I made a big mistake in the presentation, yet I managed to recover without losing the room." },
      ],
      evaluationRubric: {
        requiredTokens: ["made", "mistake"],
        errorTag: "collocation_choice",
        commonSlip: "Using a literal verb that does not collocate naturally.",
        severity: "medium",
      },
    },
    {
      prompt: "Which sentence uses the collocation more naturally?",
      promptType: "rewrite",
      interactionType: "hybrid_choice_text",
      choiceOptions: [
        { id: "A", text: "We made a decision after the discussion." },
        { id: "B", text: "We took a decision after the discussion." },
      ],
      correctChoiceId: "A",
      choiceFeedbackByOption: {
        B: {
          whatWentWrong:
            "The noun is fine, but the verb still sounds translated rather than natural.",
          why: 'Decision usually pairs with "make" in this chunk.',
          whatFitsInstead:
            'Choose "We made a decision after the discussion." to keep the collocation natural.',
        },
      },
      followUpPrompt: "Rewrite only the better sentence exactly before moving on.",
      followUpPromptType: "rewrite",
      followUpMode: "exact_rewrite",
      followUpAcceptedAnswer: "We made a decision after the discussion.",
      followUpWhyItWorks:
        "You kept the natural English chunk instead of the direct translation.",
      followUpHint1: "Keep the noun decision, but switch to the natural verb.",
      followUpHint2: "Think of the high-frequency chunk make a decision.",
      followUpNaturalRewrite:
        "We made a decision after the discussion and moved forward immediately.",
      followUpLevelUpVariants: [
        { level: "B1", text: "We made a decision after the discussion." },
        { level: "B2", text: "We made a decision after the discussion and moved forward immediately." },
        { level: "C1", text: "We made a decision after the discussion, which finally gave the team a clear direction." },
      ],
      followUpEvaluationRubric: {
        requiredTokens: ["made", "decision"],
        errorTag: "collocation_choice",
        commonSlip: "Choosing the wrong verb in a common phrase chunk.",
        severity: "medium",
      },
      structureKey: "collocations",
      levelBand: "B1",
      supportObjective: "Replace direct translation with natural chunks.",
      topic: "meetings",
      memoryAnchor: false,
      acceptedAnswer: "We made a decision after the discussion.",
      whyItWorks: "Make a decision is the natural English chunk.",
      hint1: "The noun is fine, but the verb sounds translated.",
      hint2: "Think of the usual verb that pairs with decision.",
      naturalRewrite: "We made a decision after the discussion and moved forward immediately.",
      levelUpVariants: [
        { level: "B1", text: "We made a decision after the discussion." },
        { level: "B2", text: "We made a decision after the discussion and moved forward immediately." },
        { level: "C1", text: "We made a decision after the discussion, which finally gave the team a clear direction." },
      ],
      evaluationRubric: {
        requiredTokens: ["made", "decision"],
        errorTag: "collocation_choice",
        commonSlip: "Choosing the wrong verb in a common phrase chunk.",
        severity: "medium",
      },
    },
    {
      prompt: "Write one sentence about progress using a natural collocation.",
      promptType: "memory_anchor",
      structureKey: "collocations",
      levelBand: "B1",
      supportObjective: "Turn vocabulary knowledge into usable chunks.",
      topic: "progress",
      memoryAnchor: true,
      acceptedAnswer: "I am making steady progress with my speaking practice.",
      whyItWorks: "Make steady progress is a natural chunk that sounds more fluent than a word-by-word translation.",
      hint1: "Think of a verb that often goes with progress.",
      hint2: "Use make with progress.",
      naturalRewrite: "I am making steady progress with my speaking practice, even if the improvement still feels gradual.",
      levelUpVariants: [
        { level: "B1", text: "I am making steady progress with my speaking practice." },
        { level: "B2", text: "I am making steady progress with my speaking practice, even if the improvement still feels gradual." },
        { level: "C1", text: "I am making steady progress with my speaking practice, which is far more motivating than chasing dramatic short-term jumps." },
      ],
      evaluationRubric: {
        requiredTokens: ["making", "progress"],
        errorTag: "collocation_choice",
        commonSlip: "Using a less natural verb with a common noun.",
        severity: "medium",
      },
    },
    {
      prompt: "Complete the sentence naturally: We need to ____ attention to the last part of the report.",
      promptType: "completion",
      structureKey: "collocations",
      levelBand: "B1",
      supportObjective: "Strengthen high-frequency chunks.",
      topic: "reports",
      memoryAnchor: false,
      acceptedAnswer: "We need to pay attention to the last part of the report.",
      whyItWorks: "Pay attention is a stable chunk that should feel automatic.",
      hint1: "This noun usually pairs with one high-frequency verb.",
      hint2: "Use the common verb with attention.",
      naturalRewrite: "We need to pay attention to the last part of the report because that is where most readers will hesitate.",
      levelUpVariants: [
        { level: "B1", text: "We need to pay attention to the last part of the report." },
        { level: "B2", text: "We need to pay attention to the last part of the report because that is where most readers will hesitate." },
        { level: "C1", text: "We need to pay attention to the last part of the report, since that section is most likely to shape the reader's final judgment." },
      ],
      evaluationRubric: {
        requiredTokens: ["pay", "attention"],
        errorTag: "collocation_choice",
        commonSlip: "Missing a very common chunk under pressure.",
        severity: "medium",
      },
    },
    {
      prompt: "Use these ideas in one sentence: strong, coffee, morning.",
      promptType: "guided_generation",
      structureKey: "collocations",
      levelBand: "B1",
      supportObjective: "Build everyday collocations under constraint.",
      topic: "routine",
      memoryAnchor: false,
      acceptedAnswer: "I usually drink strong coffee in the morning.",
      whyItWorks: "Strong coffee is a natural collocation in English.",
      hint1: "Not every adjective-noun pair feels equally natural.",
      hint2: "Keep strong with coffee.",
      naturalRewrite: "I usually drink strong coffee in the morning because it helps me settle into the day.",
      levelUpVariants: [
        { level: "B1", text: "I usually drink strong coffee in the morning." },
        { level: "B2", text: "I usually drink strong coffee in the morning because it helps me settle into the day." },
        { level: "C1", text: "I usually drink strong coffee in the morning, a habit that somehow still feels like the cleanest way to begin the day." },
      ],
      evaluationRubric: {
        requiredTokens: ["strong", "coffee"],
        errorTag: "collocation_choice",
        commonSlip: "Choosing awkward adjective-noun combinations.",
        severity: "low",
      },
    },
  ],
  "spoken-chunks": [
    {
      prompt: "Which sentence sounds more natural in everyday English?",
      promptType: "rewrite",
      contentSource: "authored_bank",
      feedbackStrategy: "spoken_chunk",
      groundingTargets: ["go home"],
      allowOpenProduction: false,
      interactionType: "hybrid_choice_text",
      choiceOptions: [
        { id: "A", text: "I want to go home now." },
        { id: "B", text: "I want to go to home now." },
      ],
      correctChoiceId: "A",
      choiceFeedbackByOption: {
        B: {
          whatWentWrong:
            'English treats "go home" like a chunk, so adding "to" makes it sound translated.',
          why: '"Home" already works as the destination here.',
          whatFitsInstead: 'Choose "I want to go home now." to keep the chunk natural.',
        },
      },
      followUpPrompt: "Rewrite only the better sentence exactly before moving on.",
      followUpPromptType: "rewrite",
      followUpMode: "exact_rewrite",
      followUpAcceptedAnswer: "I want to go home now.",
      followUpWhyItWorks: 'The sentence keeps the chunk "go home" intact.',
      followUpHint1: 'Use the chunk "go home" without an extra preposition.',
      followUpHint2: 'Write the sentence with "go home", not "go to home".',
      followUpNaturalRewrite: "I want to go home now because I am completely done for the day.",
      followUpLevelUpVariants: [
        { level: "B1", text: "I want to go home now." },
        { level: "B2", text: "I want to go home now because I am completely done for the day." },
        { level: "C1", text: "I want to go home now, to be honest, because my energy has completely run out." },
      ],
      followUpEvaluationRubric: {
        requiredTokens: ["go", "home"],
        errorTag: "spoken_chunk_go_home",
        commonSlip: 'Breaking the chunk "go home" with an extra preposition.',
        severity: "high",
      },
      structureKey: "spoken-chunks",
      levelBand: "B1",
      supportObjective: "Sound more natural in spoken flow.",
      topic: "chunks",
      memoryAnchor: false,
      acceptedAnswer: "I want to go home now.",
      whyItWorks: 'The sentence uses the spoken chunk "go home" naturally.',
      hint1: 'Use the chunk "go home" without an extra preposition.',
      hint2: 'Keep the destination chunk intact.',
      naturalRewrite: "I want to go home now because I am running out of patience.",
      levelUpVariants: [
        { level: "B1", text: "I want to go home now." },
        { level: "B2", text: "I want to go home now because I am running out of patience." },
        { level: "C1", text: "I want to go home now, to be honest, because my brain is finished for the day." },
      ],
      evaluationRubric: {
        requiredTokens: ["go", "home"],
        errorTag: "spoken_chunk_go_home",
        commonSlip: 'Breaking the chunk "go home" with an extra preposition.',
        severity: "high",
      },
    },
    {
      prompt: "Complete the sentence naturally: ____ be honest, I expected it to be easier.",
      promptType: "completion",
      contentSource: "authored_bank",
      feedbackStrategy: "spoken_chunk",
      groundingTargets: ["to be honest"],
      allowOpenProduction: false,
      structureKey: "spoken-chunks",
      levelBand: "B1",
      supportObjective: "Sound more natural in spoken flow.",
      topic: "chunks",
      memoryAnchor: false,
      acceptedAnswer: "To be honest, I expected it to be easier.",
      whyItWorks: '"To be honest" is a stable chunk that softens the opinion naturally.',
      hint1: 'This chunk starts with "to".',
      hint2: 'Write the full opener "to be honest".',
      naturalRewrite: "To be honest, I expected it to be easier once I started.",
      levelUpVariants: [
        { level: "B1", text: "To be honest, I expected it to be easier." },
        { level: "B2", text: "To be honest, I expected it to be easier once I actually started." },
        { level: "C1", text: "To be honest, I expected it to be easier, which is probably why the first setback hit harder than it should have." },
      ],
      evaluationRubric: {
        requiredTokens: ["to", "be", "honest"],
        errorTag: "spoken_chunk_honest",
        commonSlip: "Losing part of a fixed spoken opener.",
        severity: "medium",
      },
    },
    {
      prompt: "Correct the chunk: At the same side, I can see why they chose it.",
      promptType: "error_correction",
      contentSource: "authored_bank",
      feedbackStrategy: "spoken_chunk",
      groundingTargets: ["at the same time"],
      allowOpenProduction: false,
      structureKey: "spoken-chunks",
      levelBand: "B1",
      supportObjective: "Sound more natural in spoken flow.",
      topic: "chunks",
      memoryAnchor: false,
      acceptedAnswer: "At the same time, I can see why they chose it.",
      whyItWorks: '"At the same time" is the natural spoken chunk for balancing two ideas.',
      hint1: 'Replace the wrong word inside the chunk.',
      hint2: 'Use "time", not "side".',
      naturalRewrite: "At the same time, I can see why they chose it, so I am not completely against the idea.",
      levelUpVariants: [
        { level: "B1", text: "At the same time, I can see why they chose it." },
        { level: "B2", text: "At the same time, I can see why they chose it, even if I still have concerns." },
        { level: "C1", text: "At the same time, I can see why they chose it, which is why my reaction is more mixed than negative." },
      ],
      evaluationRubric: {
        requiredTokens: ["same", "time"],
        errorTag: "spoken_chunk_same_time",
        commonSlip: "Changing one word inside a fixed chunk and making it sound unnatural.",
        severity: "high",
      },
    },
    {
      prompt: "Use these ideas in one sentence: a bit, tired, after work.",
      promptType: "guided_generation",
      contentSource: "authored_bank",
      feedbackStrategy: "spoken_chunk",
      groundingTargets: ["a bit"],
      allowOpenProduction: false,
      structureKey: "spoken-chunks",
      levelBand: "B1",
      supportObjective: "Sound more natural in spoken flow.",
      topic: "chunks",
      memoryAnchor: false,
      acceptedAnswer: "I was a bit tired after work.",
      whyItWorks: '"A bit" is a natural spoken chunk for softening degree.',
      hint1: 'Keep "a bit" together as one chunk.',
      hint2: 'Build one simple sentence around the chunk.',
      naturalRewrite: "I was a bit tired after work, so I did not want to talk much on the way home.",
      levelUpVariants: [
        { level: "B1", text: "I was a bit tired after work." },
        { level: "B2", text: "I was a bit tired after work, so I went home earlier than usual." },
        { level: "C1", text: "I was a bit tired after work, which was enough to kill any plan that involved seeing other people." },
      ],
      evaluationRubric: {
        requiredTokens: ["bit", "tired", "work"],
        errorTag: "spoken_chunk_bit",
        commonSlip: 'Dropping part of the chunk "a bit" and sounding less natural than spoken English usually does.',
        severity: "medium",
      },
    },
    {
      prompt: 'Rewrite this more naturally with the chunk "that said": I understand your reasons, but I still disagree.',
      promptType: "rewrite",
      contentSource: "authored_bank",
      feedbackStrategy: "spoken_chunk",
      groundingTargets: ["that said"],
      allowOpenProduction: false,
      structureKey: "spoken-chunks",
      levelBand: "B1",
      supportObjective: "Sound more natural in spoken flow.",
      topic: "chunks",
      memoryAnchor: false,
      acceptedAnswer: "That said, I still disagree.",
      whyItWorks: '"That said" is a compact spoken chunk for turning to the contrasting point.',
      hint1: 'Start with the chunk "that said".',
      hint2: 'Keep the contrast short and natural.',
      naturalRewrite: "That said, I still disagree because the change feels rushed.",
      levelUpVariants: [
        { level: "B1", text: "That said, I still disagree." },
        { level: "B2", text: "That said, I still disagree because the timing feels rushed." },
        { level: "C1", text: "That said, I still disagree, mainly because the timing makes the whole change feel rushed." },
      ],
      evaluationRubric: {
        requiredTokens: ["that", "said", "disagree"],
        errorTag: "spoken_chunk_that_said",
        commonSlip: "Explaining the contrast word by word instead of using the spoken chunk directly.",
        severity: "medium",
      },
    },
  ],
};

function pickKeywords(example: string) {
  return example
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 3)
    .slice(0, 3);
}

function expandExample(example: string, structureKey: string) {
  const topic = getStructureUnit(structureKey);
  const builderKind = topic?.builderKind ?? "grammar";
  const trimmed = example.trim().replace(/[.!?]+$/, "");

  if (!trimmed) {
    return example;
  }

  const ending =
    builderKind === "vocabulary"
      ? "which makes the wording sound more deliberate."
      : builderKind === "phrase_idiom"
        ? "which makes the phrase sound more natural in context."
        : builderKind === "sentence"
          ? "which keeps the sentence more connected."
          : "which keeps the form under better control.";

  return `${trimmed}, ${ending}`;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replaceFirstWholeWord(text: string, target: string, replacement: string) {
  const pattern = new RegExp(`\\b${escapeRegExp(target)}\\b`, "i");
  return text.replace(pattern, replacement);
}

function cleanupSentence(text: string) {
  return text
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
}

function buildSafeFallbackChoiceVariant(example: string, keywords: string[]) {
  const trimmed = example.trim();

  for (const keyword of keywords) {
    const candidate = cleanupSentence(replaceFirstWholeWord(trimmed, keyword, ""));
    if (candidate && candidate !== trimmed) {
      return candidate;
    }
  }

  return cleanupSentence(`${trimmed} ${keywords[0] ?? ""}`);
}

function buildSafeFallbackCompletionPrompt(example: string, keywords: string[]) {
  const trimmed = example.trim();

  for (const keyword of keywords) {
    const candidate = replaceFirstWholeWord(trimmed, keyword, "____");
    if (candidate !== trimmed) {
      return `Complete the sentence naturally: ${cleanupSentence(candidate)}`;
    }
  }

  return `Complete the sentence naturally: ${trimmed} ____`;
}

function createFallbackBlueprints(structureKey: string): PracticeBlueprint[] {
  const topic = getStructureUnit(structureKey);

  if (!topic) {
    return [];
  }

  const examples = topic.examples.slice(0, 3);
  const fallbackExamples = examples.length
    ? examples
    : [`Use ${topic.title.toLowerCase()} in one clear sentence.`];
  const primaryExample = fallbackExamples[0] ?? `Use ${topic.title.toLowerCase()} in one clear sentence.`;
  const secondaryExample = fallbackExamples[1] ?? primaryExample;
  const tertiaryExample = fallbackExamples[2] ?? secondaryExample;
  const primaryNatural = expandExample(primaryExample, structureKey);
  const secondaryNatural = expandExample(secondaryExample, structureKey);
  const tertiaryNatural = expandExample(tertiaryExample, structureKey);
  const primaryKeywordPool = pickKeywords(primaryExample);
  const primaryKeywords = primaryKeywordPool.length ? primaryKeywordPool : pickKeywords(topic.title);
  const secondaryKeywordPool = pickKeywords(secondaryExample);
  const secondaryKeywords = secondaryKeywordPool.length ? secondaryKeywordPool : primaryKeywords;
  const primaryWeakOption = buildSafeFallbackChoiceVariant(primaryExample, primaryKeywords);
  const secondaryWeakOption = buildSafeFallbackChoiceVariant(secondaryExample, secondaryKeywords);

  return [
    {
      prompt: `Which sentence keeps ${topic.title.toLowerCase()} more clearly?`,
      promptType: "rewrite",
      contentSource: "safe_fallback",
      feedbackStrategy: "generic",
      groundingTargets: primaryKeywords,
      allowOpenProduction: false,
      interactionType: "hybrid_choice_text",
      choiceOptions: [
        { id: "A", text: primaryExample },
        { id: "B", text: primaryWeakOption },
      ],
      correctChoiceId: "A",
      choiceFeedbackByOption: {
        B: {
          whatWentWrong:
            `This version drops part of the target pattern, so ${topic.title.toLowerCase()} no longer lands cleanly.`,
          why: topic.commonMistakes[0] ?? `The pattern weakens when a key part disappears.`,
          whatFitsInstead: `Choose "${primaryExample}" to keep the target form intact.`,
        },
      },
      followUpPrompt: "Rewrite only the better sentence exactly before moving on.",
      followUpPromptType: "rewrite",
      followUpMode: "exact_rewrite",
      followUpAcceptedAnswer: primaryExample,
      followUpWhyItWorks: topic.teachingSummary,
      followUpHint1: `Keep the key target words in place while you rewrite the sentence exactly.`,
      followUpHint2: `Copy the stronger version exactly so the target form stays stable.`,
      followUpNaturalRewrite: primaryNatural,
      followUpLevelUpVariants: [
        { level: topic.baseLevel, text: primaryExample },
        { level: topic.baseLevel === "A2" ? "B1" : topic.baseLevel, text: primaryNatural },
        { level: "C1", text: secondaryNatural },
      ],
      followUpEvaluationRubric: {
        requiredTokens: primaryKeywords,
        errorTag: `${structureKey}_safe_choice`,
        commonSlip: topic.commonMistakes[0] ?? `Dropping the target form under pressure.`,
        severity: "medium",
      },
      structureKey,
      levelBand: topic.baseLevel,
      supportObjective: topic.supportObjective,
      topic: topic.categoryPath.at(-1)?.toLowerCase() ?? topic.family.toLowerCase(),
      memoryAnchor: false,
      acceptedAnswer: primaryExample,
      whyItWorks: topic.teachingSummary,
      hint1: `Keep the key target words in place while you rewrite the sentence exactly.`,
      hint2: `Copy the stronger version exactly so the target form stays stable.`,
      naturalRewrite: primaryNatural,
      levelUpVariants: [
        { level: topic.baseLevel, text: primaryExample },
        { level: topic.baseLevel === "A2" ? "B1" : topic.baseLevel, text: primaryNatural },
        { level: "C1", text: secondaryNatural },
      ],
      evaluationRubric: {
        requiredTokens: primaryKeywords,
        errorTag: `${structureKey}_safe_choice`,
        commonSlip: topic.commonMistakes[0] ?? `Losing control over ${topic.title.toLowerCase()} under pressure.`,
        severity: "medium",
      },
    },
    {
      prompt: buildSafeFallbackCompletionPrompt(primaryExample, primaryKeywords),
      promptType: "completion",
      contentSource: "safe_fallback",
      feedbackStrategy: "generic",
      groundingTargets: primaryKeywords,
      allowOpenProduction: false,
      structureKey,
      levelBand: topic.baseLevel,
      supportObjective: topic.supportObjective,
      topic: topic.family.toLowerCase(),
      memoryAnchor: false,
      acceptedAnswer: primaryExample,
      whyItWorks: `The sentence keeps the target pattern complete instead of dropping one of its key parts.`,
      hint1: `Restore the missing target word so the sentence sounds complete again.`,
      hint2: topic.whenToUse,
      naturalRewrite: primaryNatural,
      levelUpVariants: [
        { level: topic.baseLevel, text: primaryExample },
        { level: "B2", text: primaryNatural },
        { level: "C1", text: secondaryNatural },
      ],
      evaluationRubric: {
        requiredTokens: primaryKeywords,
        errorTag: `${structureKey}_safe_completion`,
        commonSlip: topic.commonMistakes[0] ?? `Leaving out one of the target pieces under pressure.`,
        severity: "medium",
      },
    },
    {
      prompt: `Use these target words in one sentence: ${primaryKeywords.join(", ")}.`,
      promptType: "guided_generation",
      contentSource: "safe_fallback",
      feedbackStrategy: "generic",
      groundingTargets: primaryKeywords,
      allowOpenProduction: false,
      structureKey,
      levelBand: topic.baseLevel,
      supportObjective: topic.supportObjective,
      topic: topic.family.toLowerCase(),
      memoryAnchor: false,
      acceptedAnswer: primaryExample,
      whyItWorks: `The sentence uses ${topic.title.toLowerCase()} with the intended focus instead of forcing it.`,
      hint1: "Turn the key words into one connected idea.",
      hint2: topic.whenNotToUse,
      naturalRewrite: primaryNatural,
      levelUpVariants: [
        { level: topic.baseLevel, text: primaryExample },
        { level: "B2", text: primaryNatural },
        { level: "C1", text: secondaryNatural },
      ],
      evaluationRubric: {
        requiredTokens: primaryKeywords,
        errorTag: `${structureKey}_safe_guided`,
        commonSlip: topic.commonMistakes[0] ?? `The ideas stay disconnected instead of forming a usable sentence.`,
        severity: "medium",
      },
    },
    {
      prompt: `Which sentence keeps ${topic.title.toLowerCase()} more clearly?`,
      promptType: "rewrite",
      contentSource: "safe_fallback",
      feedbackStrategy: "generic",
      groundingTargets: secondaryKeywords,
      allowOpenProduction: false,
      interactionType: "hybrid_choice_text",
      choiceOptions: [
        { id: "A", text: secondaryExample },
        { id: "B", text: secondaryWeakOption },
      ],
      correctChoiceId: "A",
      choiceFeedbackByOption: {
        B: {
          whatWentWrong:
            `This version weakens the target pattern, so the structure stops sounding dependable.`,
          why: topic.commonMistakes[1] ?? topic.commonMistakes[0] ?? `One key part of the pattern is missing.`,
          whatFitsInstead: `Choose "${secondaryExample}" to keep the pattern intact.`,
        },
      },
      followUpPrompt: "Rewrite only the better sentence exactly before moving on.",
      followUpPromptType: "rewrite",
      followUpMode: "exact_rewrite",
      followUpAcceptedAnswer: secondaryExample,
      followUpWhyItWorks: `The sentence keeps the target form intact.`,
      followUpHint1: `Rewrite the stronger version exactly.`,
      followUpHint2: `Keep the target words in the sentence when you copy it.`,
      followUpNaturalRewrite: secondaryNatural,
      followUpLevelUpVariants: [
        { level: topic.baseLevel, text: secondaryExample },
        { level: "B2", text: secondaryNatural },
        { level: "C1", text: tertiaryNatural },
      ],
      followUpEvaluationRubric: {
        requiredTokens: secondaryKeywords,
        errorTag: `${structureKey}_safe_choice`,
        commonSlip: topic.commonMistakes[1] ?? topic.commonMistakes[0] ?? `One key part of the pattern is missing.`,
        severity: "medium",
      },
      structureKey,
      levelBand: topic.baseLevel,
      supportObjective: topic.supportObjective,
      topic: topic.family.toLowerCase(),
      memoryAnchor: false,
      acceptedAnswer: secondaryExample,
      whyItWorks: `The sentence keeps the pattern intact instead of weakening it.`,
      hint1: `Rewrite the stronger version exactly.`,
      hint2: `Keep the target words in the sentence when you copy it.`,
      naturalRewrite: secondaryNatural,
      levelUpVariants: [
        { level: topic.baseLevel, text: secondaryExample },
        { level: "B2", text: secondaryNatural },
        { level: "C1", text: tertiaryNatural },
      ],
      evaluationRubric: {
        requiredTokens: secondaryKeywords,
        errorTag: `${structureKey}_safe_choice`,
        commonSlip: topic.commonMistakes[1] ?? topic.commonMistakes[0] ?? `The pattern weakens when a key part disappears.`,
        severity: "medium",
      },
    },
    {
      prompt: `Use these target words in one sentence: ${secondaryKeywords.join(", ")}.`,
      promptType: "guided_generation",
      contentSource: "safe_fallback",
      feedbackStrategy: "generic",
      groundingTargets: secondaryKeywords,
      allowOpenProduction: false,
      structureKey,
      levelBand: topic.baseLevel,
      supportObjective: topic.supportObjective,
      topic: topic.family.toLowerCase(),
      memoryAnchor: false,
      acceptedAnswer: secondaryExample,
      whyItWorks: `The sentence keeps the target words connected in a usable way.`,
      hint1: "Turn the target words into one clear sentence.",
      hint2: topic.whenToUse,
      naturalRewrite: tertiaryNatural,
      levelUpVariants: [
        { level: topic.baseLevel, text: secondaryExample },
        { level: "B2", text: secondaryNatural },
        { level: "C1", text: tertiaryNatural },
      ],
      evaluationRubric: {
        requiredTokens: secondaryKeywords,
        errorTag: `${structureKey}_safe_guided`,
        commonSlip: topic.commonMistakes[2] ?? topic.commonMistakes[0] ?? `The sentence still loses the target pattern under pressure.`,
        severity: "medium",
      },
    },
  ];
}

const builderVariantNotes = {
  grammar: [
    "",
    "Keep the form accurate, not just close enough.",
    "Aim for one clean version that would still hold in a real sentence.",
    "Keep it natural without losing structural control.",
  ],
  vocabulary: [
    "",
    "Choose wording that sounds natural in real use.",
    "Keep the collocation or register sharp, not generic.",
    "Make the word choice feel usable, not memorized.",
  ],
  phrase_idiom: [
    "",
    "Use the phrase naturally, not literally.",
    "Make the chunk sound like something a real speaker would choose.",
    "Keep the expression fluent instead of over-explained.",
  ],
  sentence: [
    "",
    "Keep the ideas connected instead of list-like.",
    "Aim for one sentence with better flow, not just more words.",
    "Make the sentence sound controlled under pressure.",
  ],
} as const;

const promptVariantNotes: Partial<Record<PromptType, string[]>> = {
  memory_anchor: [
    "",
    "Keep it personal and specific.",
    "Use a real detail instead of a generic example.",
    "Make it sound like something you would actually say.",
  ],
  rewrite: [
    "",
    "Keep the meaning, but tighten the language.",
    "Change the language, not the core idea.",
    "Make the sentence sound more natural than literal.",
  ],
  guided_generation: [
    "",
    "Turn the ideas into one connected sentence.",
    "Keep the sentence fluent instead of mechanical.",
    "Use the ideas with clear flow, not as a list.",
  ],
  free_production: [
    "",
    "Keep the sentence concrete and believable.",
    "Make the sentence sound natural, not like an exercise.",
    "Write one version you could really use.",
  ],
  constraint_based: [
    "",
    "Use every constraint without sounding forced.",
    "Keep the sentence connected while you use all the ideas.",
    "Make the sentence feel natural even with the required pieces.",
  ],
  error_correction: [
    "",
    "Fix the sentence without changing the core meaning.",
    "Repair the weak language choice, then keep it usable.",
    "Correct only what needs fixing, then make it sound natural.",
  ],
  completion: [
    "",
    "Fill every blank with one natural choice.",
    "Complete the whole sentence so the flow stays natural.",
    "Use gap choices that still sound usable in real English.",
  ],
};

function applyPromptVariant(
  blueprint: PracticeBlueprint,
  sessionSeed: number,
  itemIndex: number,
) {
  const topic = getStructureUnit(blueprint.structureKey);
  const builderKind = topic?.builderKind ?? "grammar";
  const variantIndex = (sessionSeed + itemIndex) % 4;
  const builderNote = builderVariantNotes[builderKind][variantIndex];
  const promptNote = promptVariantNotes[blueprint.promptType]?.[variantIndex] ?? "";
  const completionPrefixes = [
    "Complete the sentence naturally:",
    "Complete the sentence so it sounds natural:",
    "Fill the gaps naturally:",
    "Complete the sentence with natural English:",
  ];
  const prompt =
    blueprint.interactionType === "hybrid_choice_text"
      ? blueprint.prompt
      : blueprint.promptType === "completion"
      ? blueprint.prompt.replace(
          /^Complete the sentence naturally:/i,
          completionPrefixes[variantIndex] ?? completionPrefixes[0],
        )
      : (() => {
          const suffix = [promptNote, builderNote].filter(Boolean).join(" ");
          return suffix ? `${blueprint.prompt} ${suffix}` : blueprint.prompt;
        })();

  return {
    ...blueprint,
    prompt,
    variantId: `${blueprint.structureKey}:${sessionSeed}:${itemIndex}`,
    variantLabel: variantIndex === 0 ? "core" : `variant-${variantIndex}`,
  };
}

export function getPracticeBlueprints(structureKey: string) {
  const blueprints = practiceBlueprintBank[structureKey] ?? createFallbackBlueprints(structureKey);

  return blueprints.map((blueprint) => ({
    ...blueprint,
    contentSource: blueprint.contentSource ?? "authored_bank",
    feedbackStrategy:
      blueprint.feedbackStrategy ??
      (structureKey === "reported-speech"
        ? "reported_speech"
        : structureKey === "spoken-chunks"
          ? "spoken_chunk"
          : "generic"),
    groundingTargets: blueprint.groundingTargets ?? blueprint.evaluationRubric.requiredTokens,
    allowOpenProduction:
      blueprint.allowOpenProduction ??
      (blueprint.promptType === "memory_anchor" || blueprint.promptType === "free_production"),
  }));
}

export function getPracticeBlueprintVariants(
  structureKey: string,
  sessionSeed = 0,
) {
  return getPracticeBlueprints(structureKey).map((blueprint, index) =>
    applyPromptVariant(blueprint, sessionSeed, index),
  );
}
