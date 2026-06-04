import Flashcard from "../models/Flashcard.js";

export const getFlashcards = async (req, res, next) => {
    try{
        const flashcards=await Flashcard.find({
            userId:req.user._id,
            documentId:req.params.documentId
        })
        .populate('documentId', 'title fileName')
        .sort({createdAt:-1});

        res.status(200).json({
            success:true,
            count:flashcards.length,
            data:flashcards

        });
    }catch (error){
        next(error);
    }
};

export const getFlashcardSets= async (req, res,next) => {
    try{
        const flashcardSets=await Flashcard.find({
            userId:req.user._id
        })
        .populate('documentId', 'title ')
        .sort({createdAt:-1
        });

        res.status(200).json({
            success:true,
            count:flashcardSets.length,
            data:flashcardSets
        });
    }catch (error){
        next(error);
    }
    
};

export const reviewFlashcard = async (req, res) => {
    try {
        const flashcardSet = await Flashcard.findOne({
            'cards._id': req.params.cardId,
            userId: req.user._id
        });

        if (!flashcardSet) {
            return res.status(404).json({
                success: false,
                message: "Flashcard not found",
            });
        }

        const card = flashcardSet.cards.id(req.params.cardId);
        if (!card) {
            return res.status(404).json({
                success: false,
                message: "Flashcard not found",
            });
        }

        card.reviewCount = (card.reviewCount || 0) + 1;
        card.lastReviewed = new Date();

        await flashcardSet.save();

        res.status(200).json({
            success: true,
            data: flashcardSet,
        });
    } catch (error) {
        console.error("Review Flashcard Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to review flashcard",
        });
    }
};

export const toggleStar = async (req, res) => {
    try {
        const flashcardSet = await Flashcard.findOne({
            'cards._id': req.params.cardId,
            userId: req.user._id
        });

        if (!flashcardSet) {
            return res.status(404).json({
                success: false,
                message: "Flashcard not found",
            });
        }

        const card = flashcardSet.cards.id(req.params.cardId);
        if (!card) {
            return res.status(404).json({
                success: false,
                message: "Flashcard not found",
            });
        }

        card.isStarred = !card.isStarred;

        await flashcardSet.save();

        res.status(200).json({
            success: true,
            data: flashcardSet,
        });
    } catch (error) {
        console.error("Toggle Star Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update star status",
        });
    }
};

export const deleteFlashcardSet= async(req,res,next)=>{
   try{
    const flashcardSet=await Flashcard.findOne({
        _id:req.params.flashcardId,
        userId:req.user._id
    }   );
    if(!flashcardSet){
        return res.status(404).json({
            success:false,
            error:'Flashcard not found',
            statusCode:404
        });

    }
    await flashcardSet.deleteOne();
    res.status(200).json({
        success:true,
        data:flashcardSet,
        message:`Flashcards deleted`
    });
        
    }catch (error){
        next(error);
    }
};
