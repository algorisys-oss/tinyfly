import type { Module } from './types'

/**
 * The course as one markdown document, for `llms-full.txt`: every module, lesson
 * and step in order, with the step's explanation and a working solution. Checks
 * and starter code are left out; a model needs what is taught, not the grading.
 */

export const COURSE_URL = '/learn'

export function courseMarkdown(course: Module[]): string {
  const steps = course.reduce((count, module) => count + module.lessons.reduce((sum, lesson) => sum + lesson.steps.length, 0), 0)
  const lessons = course.reduce((count, module) => count + module.lessons.length, 0)
  const parts = [
    `# Learn tinyfly (interactive course)`,
    `The course at \`${COURSE_URL}\`: ${course.length} modules, ${lessons} lessons, ${steps} steps. Each step runs code in a preview with \`live\` (the GSAP-style API), \`play(animation)\` (plays timeline JSON on the preview's \`data-tinyfly\` elements) and \`root\` (the preview element) in scope. Scroll steps pass \`scroller: '.scroller'\` because the preview scrolls, not the window.`,
  ]

  course.forEach((module, moduleIndex) => {
    parts.push(`## ${moduleIndex + 1}. ${module.title}`, module.summary)
    for (const lesson of module.lessons) {
      parts.push(`### ${lesson.title}`, lesson.summary)
      for (const step of lesson.steps) {
        parts.push(
          `#### ${step.title}`,
          `Step: \`${COURSE_URL}/${module.id}/${lesson.id}/${step.id}\``,
          step.body.trim(),
          `Solution:\n\n\`\`\`js\n${step.solution.trim()}\n\`\`\``
        )
      }
    }
  })

  return parts.join('\n\n') + '\n'
}
