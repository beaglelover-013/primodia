import { ref } from 'vue';

export const outputTitle = ref('输出区');
export const outputText = ref('');

export function setOutput(title: string, text: string): void {
  outputTitle.value = title;
  outputText.value = text;
}
