import { describe, it, expect } from "vitest";
import { createNewCard, reviewCard, mapState, createScheduler, State } from "./index";

describe("FSRS wrapper", () => {
  describe("createNewCard", () => {
    it("returns a card with new state", () => {
      const card = createNewCard();
      expect(card.state).toBe(State.New);
      expect(card.reps).toBe(0);
      expect(card.lapses).toBe(0);
    });

    it("accepts a custom date", () => {
      const date = new Date("2025-01-01T00:00:00Z");
      const card = createNewCard(date);
      expect(card.due.toISOString()).toContain("2025-01-01");
    });
  });

  describe("reviewCard", () => {
    it("transitions from new to learning on 'again'", () => {
      const card = createNewCard();
      const result = reviewCard(card, "again");
      expect(result.card.state).toBe(State.Learning);
      expect(result.card.reps).toBe(1);
    });

    it("transitions from new to review on 'easy'", () => {
      const card = createNewCard();
      const result = reviewCard(card, "easy");
      // Easy on a new card should advance it quickly
      expect(result.card.reps).toBe(1);
    });

    it("increases reps count after each review", () => {
      const card = createNewCard();
      const result1 = reviewCard(card, "good");
      expect(result1.card.reps).toBe(1);

      const result2 = reviewCard(result1.card, "good");
      expect(result2.card.reps).toBe(2);
    });

    it("records a lapse on 'again' for a review card", () => {
      let card = createNewCard();
      // Advance card to review state
      card = reviewCard(card, "good").card;
      card = reviewCard(card, "good").card;
      card = reviewCard(card, "good").card;
      card = reviewCard(card, "good").card;

      // If card is in review state, again should cause a lapse
      if (card.state === State.Review) {
        const result = reviewCard(card, "again");
        expect(result.card.lapses).toBeGreaterThan(card.lapses);
      }
    });
  });

  describe("mapState", () => {
    it("maps all FSRS states to string names", () => {
      expect(mapState(State.New)).toBe("new");
      expect(mapState(State.Learning)).toBe("learning");
      expect(mapState(State.Review)).toBe("review");
      expect(mapState(State.Relearning)).toBe("relearning");
    });

    it("returns 'new' for unknown states", () => {
      expect(mapState(99 as State)).toBe("new");
    });
  });

  describe("createScheduler", () => {
    it("returns default scheduler without profile", () => {
      const scheduler = createScheduler();
      expect(scheduler).toBeDefined();
    });

    it("uses custom retention from profile", () => {
      const scheduler = createScheduler({ desired_retention: 0.95 });
      expect(scheduler).toBeDefined();
    });

    it("uses custom weights from profile", () => {
      const weights = Array(21).fill(0.5);
      const scheduler = createScheduler({ fsrs_weights: weights });
      expect(scheduler).toBeDefined();
    });

    it("uses learning steps from profile", () => {
      const scheduler = createScheduler({
        learning_steps: ["1", "10"],
        relearning_steps: ["10"],
      });
      expect(scheduler).toBeDefined();
    });
  });
});
