/**
 * @author Da Mu
 * @version v1.1.0.cn.sy.202508010128
 * @mail 317782199@qq.com
 */
class ListNode {
    constructor(value) {
        this.value = value;
        this.next = null;
    };
};
/**
 * @use const myLinkedList = new LinkedList();
 * @description Init
 */
export default class LinkedList {
    constructor() {
        this.head = null;
        this.tail = null;
        this.length = 0;
    };
    /**
     * 
     * @param {*} value 
     * @use myLinkedList.append(JSON.stringify({ id: '123', arr: [] }));
     * @description - Add Node -> End
     */
    append(value) {
        const newNode = new ListNode(value);

        if (!this.head) {
            this.head = newNode;
            this.tail = newNode;
        } else {
            this.tail.next = newNode;
            this.tail = newNode;
        };

        this.length++;
        return this;
    };
    /**
     * 
     * @param {*} value 
     * @use  myLinkedList.prepend(JSON.stringify({ id: '012', arr: [] }));
     * @description Add Node -> Start
     */
    prepend(value) {
        const newNode = new ListNode(value);

        if (!this.head) {
            this.head = newNode;
            this.tail = newNode;
        } else {
            newNode.next = this.head;
            this.head = newNode;
        };

        this.length++;
        return this;
    };
    /**
     * 
     * @param {*} index 
     * @param {*} value 
     * @use  myLinkedList.insertIndex(2, JSON.stringify({ id: 'XXX', arr: [] }));
     * @description Insert Node -> Index
     */
    insertIndex(index, value) {
        if (index >= this.length) {
            return this.append(value);
        };

        if (index === 0) {
            return this.prepend(value);
        };

        const newNode = new ListNode(value);
        const leader = this.traverseToIndex(index - 1);
        const holdingPointer = leader.next;
        leader.next = newNode;
        newNode.next = holdingPointer;
        this.length++;

        return this;
    };
    /**
     * 
     * @param {*} targetItem 
     * @param {*} newItem 
     * @use myLinkedList.insertItemBefore('XXX', JSON.stringify({ id: '@@@', arr: [] }));
     * @description Before inserting the target node -> Item
     */
    insertItemBefore(targetItem, newItem) {
        if (!this.head) {
            return null;
        };

        if (JSON.parse(this.head.value).id === targetItem) {
            return this.prepend(newValue);
        };

        let currentNode = this.head;

        while (currentNode.next) {
            if (JSON.parse(currentNode.next.value).id === targetItem) {
                const newNode = new ListNode(newItem);
                newNode.next = currentNode.next;
                currentNode.next = newNode;
                this.length++;
                return this;
            };
            currentNode = currentNode.next;
        };

        return null;
    };
    /**
     * 
     * @param {*} targetItem 
     * @param {*} newItem 
     * @use myLinkedList.insertItemAfter('@@@', JSON.stringify({ id: '!!!', arr: [] }));
     * @description After inserting the target node -> Item
     */
    insertItemAfter(targetItem, newItem) {
        let currentNode = this.head;

        while (currentNode) {
            if (JSON.parse(currentNode.value).id === targetItem) {
                const newNode = new ListNode(newItem);
                newNode.next = currentNode.next;
                currentNode.next = newNode;

                if (currentNode === this.tail) {
                    this.tail = newNode;
                };

                this.length++;
                return this;
            };
            currentNode = currentNode.next;
        };

        return null;
    };
    /**
     * 
     * @param {*} index 
     * @use myLinkedList.removeIndex(0);
     * @description Delete Node -> Index
     */
    removeIndex(index) {
        if (index < 0 || index >= this.length) return null;

        if (index === 0) {
            const removedNode = this.head;
            this.head = this.head.next;
            this.length--;
            if (this.length === 0) this.tail = null;
            return removedNode;
        };

        const leader = this.traverseToIndex(index - 1);
        const removedNode = leader.next;
        leader.next = removedNode.next;

        if (index === this.length - 1) {
            this.tail = leader;
        };

        this.length--;
        return removedNode;
    };
    /**
     * 
     * @param {*} item 
     * @use myLinkedList.removeItem('456');
     * @description Delete Node -> Item
     */
    removeItem(item) {

        if (!this.head) return null;

        if (JSON.parse(this.head.value).id === item) {
            const removedNode = this.head;
            this.head = this.head.next;
            this.length--;

            if (this.length === 0) {
                this.tail = null;
            };

            return removedNode;
        };

        let currentNode = this.head;
        while (currentNode.next) {
            if (JSON.parse(currentNode.next.value).id === item) {
                const removedNode = currentNode.next;
                currentNode.next = currentNode.next.next;
                this.length--;

                if (currentNode.next === null) {
                    this.tail = currentNode;
                }

                return removedNode;
            }
            currentNode = currentNode.next;
        };

        return null;
    };
    /**
     * 
     * @param {*} item 
     * @use console.log('findItem:', myLinkedList.findItem('456').value);
     * @description Query Node -> Item
     */
    findItem(item) {
        let currentNode = this.head;
        while (currentNode) {
            if (JSON.parse(currentNode.value).id === item) {
                return currentNode;
            };
            currentNode = currentNode.next;
        };

        return null;
    };

    traverseToIndex(index) {
        let counter = 0;
        let currentNode = this.head;

        while (counter !== index) {
            currentNode = currentNode.next;
            counter++;
        };

        return currentNode;
    };
    /**
     * 
     * @use myLinkedList.reverse();
     * @description Reverse linked list
     */
    reverse() {
        if (!this.head.next) return this;

        let first = this.head;
        this.tail = this.head;
        let second = first.next;

        while (second) {
            const temp = second.next;
            second.next = first;
            first = second;
            second = temp;
        }

        this.head.next = null;
        this.head = first;

        return this;
    };

    toArray() {
        const result = [];
        let currentNode = this.head;

        while (currentNode) {
            result.push(currentNode.value);
            currentNode = currentNode.next;
        };

        return result;
    };
    /**
     * @use myLinkedList.print();
     * @description print list
     */
    print() {
        console.log(this.toArray().join(' -> '));
    };

};
