import { Router, type IRouter } from "express";
import { ListCategoriesResponse } from "@workspace/api-zod";

const router: IRouter = Router();

const CATEGORIES = [
  {
    slug: "find_friends" as const,
    label: "Find Friends",
    description: "Looking for new friends to hang out with on campus.",
  },
  {
    slug: "hackathon_team" as const,
    label: "Hackathon Team",
    description: "Form or join a team for an upcoming hackathon.",
  },
  {
    slug: "study_group" as const,
    label: "Study Group",
    description: "Team up with classmates to prep for exams together.",
  },
  {
    slug: "roommate" as const,
    label: "Roommate",
    description: "Find a compatible roommate near or around campus.",
  },
  {
    slug: "project_collab" as const,
    label: "Project Collab",
    description: "Find collaborators for a class or personal project.",
  },
  {
    slug: "other" as const,
    label: "Other",
    description: "Anything else that connects the LNCT community.",
  },
];

router.get("/categories", (_req, res) => {
  const data = ListCategoriesResponse.parse(CATEGORIES);
  res.json(data);
});

export default router;
export { CATEGORIES };
