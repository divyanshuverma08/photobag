const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const requireLogin = require("../middleware/requireLogin");
const Post = mongoose.model("Post");

router.get("/allpost",requireLogin,(req,res)=>{
    Post.find().populate("postedBy","_id name pic")
    .populate("comments.postedBy","_id name")
    .sort("-createdAt")
    .exec((err,posts)=>{
        if(!err){
            res.json({posts});
        }
        else{
            console.log(err);
        }
    });
});

router.get("/getsubpost",requireLogin,(req,res)=>{
    Post.find({postedBy:{$in:req.user.following}})
    .populate("postedBy","_id name pic")
    .populate("comments.postedBy","_id name")
    .sort("-createdAt")
    .exec((err,posts)=>{
        if(!err){
            res.json({posts});
        }
        else{
            console.log(err);
        }
    });
});

router.post("/createpost",requireLogin,(req,res)=>{
    const {title,body,imgUrl} = req.body;
    if(!title || !body ||!imgUrl){
        return res.status(422).json({error:"Please add all fields"});
    }
    req.user.password=undefined;
    const post = new Post({
        title,
        body,
        photo:imgUrl,
        postedBy:req.user
    });
    post.save().then(result=>{
        res.json({post:result,message:"Successfully Added"});
    })
    .catch(err=>{
        res.json({error:"Photo not saved"});
        console.log(err);
    });

});

router.get("/mypost",requireLogin,(req,res)=>{
    Post.find({postedBy:req.user._id})
    .populate("postedBy","_id name")
    .then(posts=>{
        res.json({posts});
    })
    .catch(err=>{
      console.log(err);
    });
});

router.put("/like",requireLogin,(req,res)=>{
    Post.findByIdAndUpdate(req.body.postId,{
        $push:{likes:req.user._id}
    },{
        new:true
    }).populate("postedBy","_id name pic")
    .populate("comments.postedBy","_id name").exec((err,result)=>{
        if(err){
            return res.status(422).json({error:err});
        }else{
            res.json(result);
        }
    });
});

router.put("/unlike",requireLogin,(req,res)=>{
    Post.findByIdAndUpdate(req.body.postId,{
        $pull:{likes:req.user._id}
    },{
        new:true
    }).populate("postedBy","_id name pic")
    .populate("comments.postedBy","_id name").exec((err,result)=>{
        if(err){
            return res.status(422).json({error:err});
        }else{
            res.json(result);
        }
    });
});

router.put("/comment",requireLogin,(req,res)=>{
    const comment = {
        text:req.body.text,
        postedBy:req.user
    }
     Post.findByIdAndUpdate(req.body.postId,
        { $push: { comments: comment } },
        { new: true })
        .populate("postedBy","_id name pic")
        .populate("comments.postedBy","_id name")
        .exec((err,result)=>{
            if(err){
                return res.status(422).json({error:err});
            }
                res.json(result);
            
        })

    
});

router.delete("/delete/post/:postId",requireLogin,(req,res)=>{
    Post.findOne({_id:req.params.postId})
    .populate("postedBy","_id")
    .exec((err,post)=>{
        if(err){
            return res.status(422).json({error:err});
        }
        if(post.postedBy._id.toString() ===req.user._id.toString()){
              post.remove()
              .then(result=>{
                  res.json(result);
              })
              .catch(err=>{
                  console.log(err);
              })
        }
    })
});

router.delete("/delete/comment/:postId",requireLogin,(req,res)=>{
    Post.findByIdAndUpdate(req.params.postId,                    
        {$pull:{comments:{_id:req.body.id}}},{new:true})
        .populate("postedBy","_id name pic")
        .populate("comments.postedBy","_id name")
        .exec((err,result)=>{
            if(err){
                return res.status(422).json({error:err}); 
            }else{
                res.json(result);    }

        });
    
});

router.put("/updatepost/:postId",requireLogin,(req,res)=>{
    Post.findByIdAndUpdate(req.params.postId,{$set:{title:req.body.title,body:req.body.body}},{new:true})
    .populate("postedBy","_id name pic")
    .populate("comments.postedBy","_id name")
    .exec((err,result)=>{
        if(err){
            return res.status(422).json({error:"Post not edited"}); 
        }else{
            res.json({post:result,message:"Successfully editied"}); 
        }
    });
});

module.exports = router