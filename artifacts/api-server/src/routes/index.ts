import { Router, type IRouter } from "express";
import healthRouter from "./health";
import categoriesRouter from "./categories";
import postsRouter from "./posts";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(categoriesRouter);
router.use(postsRouter);
router.use(adminRouter);

export default router;
