import React, { useState } from "react";
import type { QuizQuestion, SchedulerController } from "../types";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface Props {
  question: QuizQuestion;
  controller: SchedulerController;
}

export const QuizDisplay: React.FunctionComponent<Props> = ({ controller, question }) => {
  const [selected, setSelected] = useState<string>();
  const [message, setMessage] = useState<string>();
  const [correct, setCorrect] = useState<boolean>(false);

  const handleSubmit = () => {
    if (selected) {
      const selectedPid = parseInt(selected);
      setMessage(
        selectedPid === question.correct
          ? `Correct! PID:${question.correct} will be scheduled next`
          : `Incorrect, the next proccess is PID:${question.correct}, not PID:${selectedPid}`
      );
      setCorrect(selectedPid === question.correct);
    }
  };

  const handleContinue = () => {
    if (selected) {
      const selectedPid = parseInt(selected);
      controller.quiz.answer(selectedPid);
      controller.play();
    }
  };

  const handleSelect = (value: string) => {
    setMessage(undefined);
    setSelected(value);
  };

  const handleSkip = () => {
    controller.quiz.skip();
    controller.play();
  };

  return (
    <div className="flex flex-col items-center gap-[12px]">
      <span>Which Process Comes Next?</span>
      <RadioGroup defaultValue={selected} onValueChange={handleSelect}>
        {question.options.map((option) => (
          <div className="flex items-center space-x-2" key={option}>
            <RadioGroupItem value={`${option}`} id={`${option}`} />
            <Label htmlFor="option-one">PID:{option}</Label>
          </div>
        ))}
      </RadioGroup>
      {message && (
        <span className={`text-[${correct ? "var(--chart-2)" : "var(--destructive)"}]`}>
          {message}
        </span>
      )}
      <div className="flex w-full justify-center gap-[12px]">
        {!message && (
          <Button variant="outline" onClick={handleSkip}>
            Skip
          </Button>
        )}
        <Button onClick={message ? handleContinue : handleSubmit} disabled={!selected}>
          {message ? "Continue" : "Submit"}
        </Button>
      </div>
      <span className="text-muted-foreground text-center font-light">
        In the event of a tie, choose the process
        <br /> with the lowest PID.
      </span>
    </div>
  );
};
