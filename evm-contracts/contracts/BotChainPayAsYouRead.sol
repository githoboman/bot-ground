// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract BotChainPayAsYouRead {
    // Error codes equivalent
    error NotAuthorized();
    error BookNotFound();
    error InvalidPrice();
    error InvalidTotals();
    error AlreadyUnlocked();

    struct Book {
        address author;
        string title;
        uint256 totalPages;
        uint256 totalChapters;
        uint256 pagePrice; // Price in native BOT token wei
        uint256 chapterPrice; // Price in native BOT token wei
        bool active;
    }

    uint256 public nextBookId = 1;
    mapping(uint256 => Book) public books;

    // Entitlement mappings
    // reader => bookId => pageNum => unlockedAt (timestamp)
    mapping(address => mapping(uint256 => mapping(uint256 => uint256))) public pageAccess;
    // reader => bookId => chapterNum => unlockedAt (timestamp)
    mapping(address => mapping(uint256 => mapping(uint256 => uint256))) public chapterAccess;

    address public owner;
    address public operator;

    event BookRegistered(uint256 indexed bookId, address indexed author, string title);
    event PagePriceUpdated(uint256 indexed bookId, uint256 newPrice);
    event ChapterPriceUpdated(uint256 indexed bookId, uint256 newPrice);
    event BookStatusUpdated(uint256 indexed bookId, bool active);
    event PageUnlocked(address indexed reader, uint256 indexed bookId, uint256 pageNum);
    event ChapterUnlocked(address indexed reader, uint256 indexed bookId, uint256 chapterNum);
    event OperatorUpdated(address indexed oldOperator, address indexed newOperator);

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotAuthorized();
        _;
    }

    modifier onlyAuthor(uint256 bookId) {
        if (books[bookId].author != msg.sender) revert NotAuthorized();
        _;
    }

    modifier canUnlockFor(address reader) {
        if (msg.sender != reader && msg.sender != operator && msg.sender != owner) {
            revert NotAuthorized();
        }
        _;
    }

    constructor() {
        owner = msg.sender;
        operator = msg.sender;
    }

    function setOperator(address newOperator) external onlyOwner {
        emit OperatorUpdated(operator, newOperator);
        operator = newOperator;
    }

    // --- Book Registry ---

    function registerBook(
        string memory title,
        uint256 totalPages,
        uint256 totalChapters,
        uint256 pagePrice,
        uint256 chapterPrice
    ) external returns (uint256) {
        if (pagePrice == 0 || chapterPrice == 0) revert InvalidPrice();
        if (totalPages == 0 || totalChapters == 0) revert InvalidTotals();

        uint256 bookId = nextBookId++;
        
        books[bookId] = Book({
            author: msg.sender,
            title: title,
            totalPages: totalPages,
            totalChapters: totalChapters,
            pagePrice: pagePrice,
            chapterPrice: chapterPrice,
            active: true
        });

        emit BookRegistered(bookId, msg.sender, title);
        return bookId;
    }

    function updatePagePrice(uint256 bookId, uint256 newPrice) external onlyAuthor(bookId) {
        if (books[bookId].author == address(0)) revert BookNotFound();
        if (newPrice == 0) revert InvalidPrice();
        
        books[bookId].pagePrice = newPrice;
        emit PagePriceUpdated(bookId, newPrice);
    }

    function updateChapterPrice(uint256 bookId, uint256 newPrice) external onlyAuthor(bookId) {
        if (books[bookId].author == address(0)) revert BookNotFound();
        if (newPrice == 0) revert InvalidPrice();
        
        books[bookId].chapterPrice = newPrice;
        emit ChapterPriceUpdated(bookId, newPrice);
    }

    function setBookActive(uint256 bookId, bool active) external onlyAuthor(bookId) {
        if (books[bookId].author == address(0)) revert BookNotFound();
        
        books[bookId].active = active;
        emit BookStatusUpdated(bookId, active);
    }

    // --- Entitlements ---

    function hasPageAccess(address reader, uint256 bookId, uint256 pageNum) public view returns (bool) {
        return pageAccess[reader][bookId][pageNum] != 0;
    }

    function hasChapterAccess(address reader, uint256 bookId, uint256 chapterNum) public view returns (bool) {
        return chapterAccess[reader][bookId][chapterNum] != 0;
    }

    function unlockPage(address reader, uint256 bookId, uint256 pageNum) external canUnlockFor(reader) {
        if (hasPageAccess(reader, bookId, pageNum)) revert AlreadyUnlocked();
        
        pageAccess[reader][bookId][pageNum] = block.timestamp;
        emit PageUnlocked(reader, bookId, pageNum);
    }

    function unlockChapter(address reader, uint256 bookId, uint256 chapterNum) external canUnlockFor(reader) {
        if (hasChapterAccess(reader, bookId, chapterNum)) revert AlreadyUnlocked();
        
        chapterAccess[reader][bookId][chapterNum] = block.timestamp;
        emit ChapterUnlocked(reader, bookId, chapterNum);
    }

    function selfUnlockPage(uint256 bookId, uint256 pageNum) external payable {
        // Assume price is verified offchain or here
        // If we want to strictly require payment in BOT natively here:
        if (books[bookId].author == address(0)) revert BookNotFound();
        uint256 price = books[bookId].pagePrice;
        require(msg.value >= price, "Insufficient BOT provided");
        
        // Forward funds to author
        if (price > 0) {
            (bool success, ) = books[bookId].author.call{value: price}("");
            require(success, "Transfer failed");
        }
        
        if (hasPageAccess(msg.sender, bookId, pageNum)) revert AlreadyUnlocked();
        pageAccess[msg.sender][bookId][pageNum] = block.timestamp;
        
        emit PageUnlocked(msg.sender, bookId, pageNum);
    }

    function selfUnlockChapter(uint256 bookId, uint256 chapterNum) external payable {
        if (books[bookId].author == address(0)) revert BookNotFound();
        uint256 price = books[bookId].chapterPrice;
        require(msg.value >= price, "Insufficient BOT provided");
        
        // Forward funds to author
        if (price > 0) {
            (bool success, ) = books[bookId].author.call{value: price}("");
            require(success, "Transfer failed");
        }
        
        if (hasChapterAccess(msg.sender, bookId, chapterNum)) revert AlreadyUnlocked();
        chapterAccess[msg.sender][bookId][chapterNum] = block.timestamp;
        
        emit ChapterUnlocked(msg.sender, bookId, chapterNum);
    }
}
