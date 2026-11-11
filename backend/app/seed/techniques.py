"""Central seed definitions for all 13 core StudyFlow techniques."""

TECHNIQUES_DATA = [
    {
        "name": "Pomodoro Technique",
        "slug": "pomodoro",
        "category": "Time Management",
        "description": "Break study into 25-minute concentrated sprints separated by short 5-minute restorative breaks. After 4 cycles, take a longer restorative rest.",
        "instructions": (
            "1. Select a single task to work on.\n"
            "2. Start the 25-minute focus timer and eliminate all distractions.\n"
            "3. Work with complete dedication until the timer chimes.\n"
            "4. Enjoy a 5-minute break away from screens.\n"
            "5. After 4 completed cycles, reward yourself with a 15-30 minute long break."
        ),
        "default_configuration": {
            "focus_minutes": 25,
            "short_break_minutes": 5,
            "long_break_minutes": 15,
            "cycles_before_long_break": 4,
            "is_timer_based": True,
        },
    },
    {
        "name": "52 / 17 Rule",
        "slug": "52-17",
        "category": "Time Management",
        "description": "A high-performance rhythm rooted in ultradian cycles: 52 minutes of intense, single-minded immersion followed by 17 minutes of absolute mental detachment.",
        "instructions": (
            "1. Prepare all needed materials before starting.\n"
            "2. Focus with 100% intensity for 52 minutes.\n"
            "3. When the session ends, step completely away from your desk for 17 minutes.\n"
            "4. Hydrate, stretch, or walk without consuming demanding media."
        ),
        "default_configuration": {
            "focus_minutes": 52,
            "short_break_minutes": 17,
            "long_break_minutes": 25,
            "cycles_before_long_break": 3,
            "is_timer_based": True,
        },
    },
    {
        "name": "Deep Work",
        "slug": "deep-work",
        "category": "Productivity",
        "description": "Prolonged, high-cognition immersion without cognitive switching or interruptions, designed for complex problem-solving and rigorous synthesis.",
        "instructions": (
            "1. Define a clear, high-cognition objective for this session.\n"
            "2. Silence all notifications, block distracting sites, and close extraneous tabs.\n"
            "3. Work uninterrupted for 60 to 90 minutes.\n"
            "4. Record key insights and progress at the conclusion."
        ),
        "default_configuration": {
            "focus_minutes": 60,
            "short_break_minutes": 10,
            "long_break_minutes": 20,
            "cycles_before_long_break": 2,
            "is_timer_based": True,
        },
    },
    {
        "name": "Custom Focus Timer",
        "slug": "custom-timer",
        "category": "Time Management",
        "description": "A completely flexible timer configuration tailored to your specific energy rhythm, subject demands, and personal schedule.",
        "instructions": (
            "1. Adjust focus and break intervals to suit your task.\n"
            "2. Set target cycles and start when ready.\n"
            "3. Keep rhythm consistent throughout the block."
        ),
        "default_configuration": {
            "focus_minutes": 45,
            "short_break_minutes": 10,
            "long_break_minutes": 20,
            "cycles_before_long_break": 3,
            "is_timer_based": True,
        },
    },
    {
        "name": "Time Blocking",
        "slug": "time-blocking",
        "category": "Time Management",
        "description": "Divide your day into dedicated time blocks assigned to specific subjects or tasks, eliminating decision fatigue and multitasking.",
        "instructions": (
            "1. Review your task list and estimate durations.\n"
            "2. Allocate dedicated calendar blocks for deep tasks and administrative tasks.\n"
            "3. Treat each block as an unbreakable appointment with yourself."
        ),
        "default_configuration": {
            "focus_minutes": 90,
            "short_break_minutes": 15,
            "long_break_minutes": 30,
            "cycles_before_long_break": 2,
            "is_timer_based": True,
        },
    },
    {
        "name": "Active Recall",
        "slug": "active-recall",
        "category": "Learning",
        "description": "Actively stimulating memory during the learning process by testing yourself before or instead of passively re-reading notes.",
        "instructions": (
            "1. Formulate questions based on the key concepts in your material.\n"
            "2. Close your notes and write or speak your answer from pure recall.\n"
            "3. Check your response against source notes and score your confidence.\n"
            "4. Re-test challenging concepts until retrieval feels smooth."
        ),
        "default_configuration": {
            "focus_minutes": 30,
            "short_break_minutes": 5,
            "is_timer_based": False,
            "workflow_type": "active_recall",
        },
    },
    {
        "name": "The Feynman Technique",
        "slug": "feynman-technique",
        "category": "Learning",
        "description": "Master any complex concept by teaching or explaining it in simple, jargon-free language as if speaking to a 10-year-old.",
        "instructions": (
            "1. Choose the concept you wish to master.\n"
            "2. Explain it using simple everyday words and clear analogies.\n"
            "3. Identify the exact moments where your explanation falters or gets vague.\n"
            "4. Return to your source material, clarify the gap, and re-craft the simplified explanation."
        ),
        "default_configuration": {
            "focus_minutes": 35,
            "short_break_minutes": 5,
            "is_timer_based": False,
            "workflow_type": "feynman",
        },
    },
    {
        "name": "Interleaved Learning",
        "slug": "interleaving",
        "category": "Learning",
        "description": "Switch between related topics or problem types during one study session to build adaptable problem-solving skills and prevent rote memorization.",
        "instructions": (
            "1. Select 2 to 3 related topics or problem categories.\n"
            "2. Work on Topic A for 20-25 minutes, then deliberately switch to Topic B.\n"
            "3. Train your mind to identify which strategy applies to each topic variation."
        ),
        "default_configuration": {
            "focus_minutes": 25,
            "short_break_minutes": 5,
            "is_timer_based": True,
            "workflow_type": "interleaving",
        },
    },
    {
        "name": "Spaced Repetition",
        "slug": "spaced-repetition",
        "category": "Revision",
        "description": "Review material at systematic expanding intervals (Day 1, 3, 7, 14, 30) leveraging the SM-2 algorithm to interrupt the forgetting curve.",
        "instructions": (
            "1. Create flashcards with atomic questions and answers.\n"
            "2. Review your due cards daily without skipping sessions.\n"
            "3. Grade your recall quality honestly from 0 to 5 to update spacing intervals."
        ),
        "default_configuration": {
            "focus_minutes": 20,
            "short_break_minutes": 5,
            "is_timer_based": False,
            "workflow_type": "spaced_repetition",
        },
    },
    {
        "name": "Brain Dump",
        "slug": "brain-dump",
        "category": "Revision",
        "description": "A timed, distraction-free retrieval practice where you write everything you know about a topic onto a blank canvas from memory.",
        "instructions": (
            "1. Set a 10 to 15-minute countdown.\n"
            "2. Write everything you remember about the subject: definitions, formulas, workflows, examples.\n"
            "3. Compare your dump with your textbook/notes and record identified gaps."
        ),
        "default_configuration": {
            "focus_minutes": 15,
            "short_break_minutes": 5,
            "is_timer_based": True,
            "workflow_type": "brain_dump",
        },
    },
    {
        "name": "Mind Mapping",
        "slug": "mind-mapping",
        "category": "Learning",
        "description": "Visually structure information by starting with a central topic node and branching into interconnected subtopics and concepts.",
        "instructions": (
            "1. Place your central theme or core question in the center.\n"
            "2. Branch out into major primary categories.\n"
            "3. Add secondary child nodes for details, examples, and connecting cross-links."
        ),
        "default_configuration": {
            "focus_minutes": 30,
            "short_break_minutes": 5,
            "is_timer_based": False,
            "workflow_type": "mind_mapping",
        },
    },
    {
        "name": "Eat the Frog",
        "slug": "eat-the-frog",
        "category": "Productivity",
        "description": "Tackle your most difficult, intimidating, or highest-impact task first thing in your study session before energy wanes.",
        "instructions": (
            "1. Identify the single most daunting academic challenge facing you today.\n"
            "2. Schedule it as your very first focus block.\n"
            "3. Protect this block fiercely; once completed, the rest of the day builds momentum."
        ),
        "default_configuration": {
            "focus_minutes": 50,
            "short_break_minutes": 10,
            "is_timer_based": True,
        },
    },
    {
        "name": "Two-Minute Rule",
        "slug": "two-minute-rule",
        "category": "Productivity",
        "description": "Overcome procrastination by agreeing to sit down and begin studying for just two minutes, lowering activation energy and sparking momentum.",
        "instructions": (
            "1. Pick a task you are avoiding.\n"
            "2. Commit to studying it for literally two minutes—no obligations after that.\n"
            "3. Once you start, inertia usually carries you forward into a full productive session."
        ),
        "default_configuration": {
            "focus_minutes": 2,
            "short_break_minutes": 1,
            "is_timer_based": True,
        },
    },
]
