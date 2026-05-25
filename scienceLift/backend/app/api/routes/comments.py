"""
Comment endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel
from app.core.database import get_db
from app.core.security import verify_token
from app.schemas.schemas import CommentResponse, CommentCreate
from app.services.comment_service import CommentService
from app.models.models import Comment, CommentLike
from typing import List, Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/papers", tags=["comments"])


def get_current_user_id(authorization: str = Header(None)) -> Optional[int]:
    """Extract user ID from authorization header."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    
    token = authorization.split(" ")[1]
    payload = verify_token(token)
    if not payload:
        return None
    
    user_id = payload.get("sub")
    return int(user_id) if user_id else None


def enrich_comment(comment: Comment, user_id: Optional[int] = None) -> Dict[str, Any]:
    """Enrich comment with likes count and user like status."""
    likes_count = len(comment.likes) if hasattr(comment, 'likes') and comment.likes else 0
    is_liked_by_user = False
    
    if user_id and hasattr(comment, 'likes') and comment.likes:
        is_liked_by_user = any(like.user_id == user_id for like in comment.likes)
    
    # Serialize author
    author_data = None
    if comment.author:
        author_data = {
            'id': comment.author.id,
            'username': comment.author.username,
            'email': comment.author.email,
            'bio': comment.author.bio,
            'profile_picture_url': comment.author.profile_picture_url,
            'banner_picture_url': comment.author.banner_picture_url,
            'is_admin': comment.author.is_admin,
            'created_at': comment.author.created_at,
        }
    
    return {
        'id': comment.id,
        'content': comment.content,
        'paper_id': comment.paper_id,
        'author_id': comment.author_id,
        'author': author_data,
        'is_edited': comment.is_edited,
        'parent_comment_id': comment.parent_comment_id,
        'created_at': comment.created_at,
        'updated_at': comment.updated_at,
        'likes_count': likes_count,
        'is_liked_by_user': is_liked_by_user
    }


def enrich_comment_with_replies(comment: Comment, user_id: Optional[int] = None) -> Dict[str, Any]:
    """Enrich comment with likes count, user like status, and recursively include replies."""
    enriched = enrich_comment(comment, user_id)
    
    # Recursively add nested replies
    replies = []
    if hasattr(comment, 'replies') and comment.replies:
        for reply in comment.replies:
            replies.append(enrich_comment_with_replies(reply, user_id))
    enriched['replies'] = replies
    
    return enriched


@router.get("/{paper_id}/comments", response_model=List[Dict[str, Any]])
def get_paper_comments(
    paper_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    """Get comments for a paper with nested replies (all levels)."""
    from sqlalchemy.orm import joinedload, selectinload
    
    user_id = get_current_user_id(authorization)
    
    # Get root comments with all relationships loaded recursively
    root_comments = db.query(Comment).filter(
        Comment.paper_id == paper_id,
        Comment.parent_comment_id == None
    ).offset(skip).limit(limit).all()
    
    result = []
    for comment in root_comments:
        # Load all relationships for this comment
        db.refresh(comment, ['author', 'likes', 'replies'])
        enriched = enrich_comment_with_replies(comment, user_id)
        result.append(enriched)
    
    return result


@router.post("/{paper_id}/comments", response_model=Dict[str, Any])
def create_comment(
    paper_id: int,
    comment_data: CommentCreate,
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    """Create a new comment or reply."""
    user_id = get_current_user_id(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    comment = CommentService.create_comment(
        db, paper_id, user_id, comment_data.content, comment_data.parent_comment_id
    )
    
    # Reload comment with relationships
    comment = db.query(Comment).options(
        joinedload(Comment.author),
        joinedload(Comment.likes)
    ).filter(Comment.id == comment.id).first()
    
    return enrich_comment(comment, user_id)


@router.put("/{paper_id}/comments/{comment_id}", response_model=Dict[str, Any])
def update_comment(
    paper_id: int,
    comment_id: int,
    comment_data: CommentCreate,
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    """Update a comment."""
    user_id = get_current_user_id(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Verify user owns the comment
    comment = CommentService.get_comment_by_id(db, comment_id)
    if not comment or comment.author_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    updated = CommentService.update_comment(db, comment_id, comment_data.content)
    if not updated:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    return enrich_comment(updated, user_id)


@router.delete("/{paper_id}/comments/{comment_id}")
def delete_comment(
    paper_id: int,
    comment_id: int,
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    """Delete a comment."""
    user_id = get_current_user_id(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Verify user owns the comment
    comment = CommentService.get_comment_by_id(db, comment_id)
    if not comment or comment.author_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    success = CommentService.delete_comment(db, comment_id)
    if not success:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    return {"message": "Comment deleted successfully"}


@router.post("/{paper_id}/comments/{comment_id}/like")
def like_comment(
    paper_id: int,
    comment_id: int,
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    """Like a comment."""
    user_id = get_current_user_id(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    comment = CommentService.get_comment_by_id(db, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    # Check if already liked
    existing_like = db.query(CommentLike).filter(
        CommentLike.comment_id == comment_id,
        CommentLike.user_id == user_id
    ).first()
    
    if not existing_like:
        like = CommentLike(comment_id=comment_id, user_id=user_id)
        db.add(like)
        db.commit()
    
    # Refresh and return updated comment
    db.refresh(comment)
    return {"message": "Comment liked", "likes_count": len(comment.likes)}


@router.delete("/{paper_id}/comments/{comment_id}/like")
def unlike_comment(
    paper_id: int,
    comment_id: int,
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    """Unlike a comment."""
    user_id = get_current_user_id(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    comment = CommentService.get_comment_by_id(db, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    like = db.query(CommentLike).filter(
        CommentLike.comment_id == comment_id,
        CommentLike.user_id == user_id
    ).first()
    
    if like:
        db.delete(like)
        db.commit()
    
    # Refresh and return updated comment
    db.refresh(comment)
    return {"message": "Comment unliked", "likes_count": len(comment.likes)}
