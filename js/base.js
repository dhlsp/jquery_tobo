;(function () {
    'use strict';

    var $form_add_task = $('.add-task')
        , $window = $(window)
        , $body = $('body')
        , task_list = []
        , $task_delete_trigger
        , $task_detail
        , $task_detail_trigger
        , $task_detail = $('.task-detail')
        , $task_detail_mask = $('.task-detail-mask')
        , current_index
        , $update_form
        , $task_detail_content
        , $task_detail_content_input
        , $checkbox_complete
        , $msg = $('.msg')
        , $msg_content = $msg.find('.msg-content')
        , $msg_confirm = $msg.find('.confired')
        , $alerter = $('.alerter')
        ;

    init();
    // pop('确定要删除？').then(function (r) {
    //     // console.log('r', r);
    // });

    function init() {
        task_list = store.get('task_list') || [];
        listen_msg_event();
        if (task_list.length)
            render_task_list();
        task_remind_check();
    }

    //提醒时间
    function task_remind_check() {
        // show_msg('555');
        var current_timestamp;
        var itl = setInterval(function () {
            for (var i = 0; i < task_list.length; i++) {
                var item = get(i), task_timestamp;

                if (!item || !item.remind_date || item.informed)
                    continue;
                current_timestamp = (new Date()).getTime();
                task_timestamp = (new Date(item.remind_date)).getTime();
                if (current_timestamp - task_timestamp >= 1) {
                    update_task(i, {informed: true});
                    show_msg(item.content);
                }
            }
        }, 300);
        // for (var i = 0; i < task_list.length; i++) {
        //     var item = get(i), task_timestamp;
        //
        //     if (!item || !item.remind_date)
        //         continue;
        //     current_timestamp = (new Date()).getTime();
        //     task_timestamp = (new Date(item.remind_date)).getTime();
        //     if (current_timestamp - task_timestamp >= 1) {
        //         notify(item.content);
        //     }
        // }
    }

    function show_msg(msg) {
        if (!msg) return;
        $msg_content.html(msg);
        $alerter.get(0).play();
        $msg.show();
    }

    function hide_msg() {
        $alerter.get(0).pause();
        $msg.hide();
    }
    
    function listen_msg_event() {
        $msg_confirm.on('click', function () {
            hide_msg();
        })
    }

    //添加Task
    $form_add_task.on('submit', on_add_task_form_submit);

    function on_add_task_form_submit(e) {
        var new_task = {}, $input;
        /* 禁用默认行为*/
        e.preventDefault();
        /* 获取新task的值*/
        $input = $(this).find('input[name=content]');
        new_task.content = $input.val();
        /*如果新task的值为空，则直接返回，否则继续执行 */
        if (!new_task.content) return;
        /* 存入新的task*/
        if (add_task(new_task)) {
            // render_task_list();
            $input.val(null);
        }
    }

    /*查找并监听所有删除按钮的点击事件*/
    function listen_delete_task() {
        $task_delete_trigger.on('click',function () {
            var $this = $(this);
            /*找到删除按钮所在的task元素*/
            var $item = $this.parent().parent();
            // console.log('$item.data(index)',$item.data('index'));
            var index = $item.data('index');
            console.log('task_list', task_list[index]);
            /*提示是否删除*/
            // var tmp = confirm('确定删除？');
            // tmp ? delete_task(index) : null;
            pop('确定要删除？', task_list[index]).then(function (r) {
                r ? delete_task(index) : null;
            })
        });
    }

    function add_task(new_task) {
        /* 将新的task推入task_list*/
        task_list.push(new_task);
        /* 更新localStorage*/
        // store.set('task_list', task_list);
        refresh_task_list();
        // alert('添加成功！');
        return true;
    }

    /*渲染全部task模板*/
    function  render_task_list() {
        var $task_list = $('.task-list');
        $task_list.html('');
        // for (var i = 0;i<task_list.length;i++){
        //     var $task = render_task_item(task_list[i], i);
        //     // $task_list.append($task);
        //     $task_list.prepend($task);
        // }

        var complete_items = [];
        for (var i = 0;i<task_list.length;i++){
            var item = task_list[i];
            // console.log('task_list', task_list[i], i)
            if (item && item.complete)
                complete_items[i] = item;
            else
                var $task = render_task_item(item, i);
            $task_list.prepend($task);
        }

        for (var j = 0;j<complete_items.length;j++){
            $task = render_task_item(complete_items[j], j);
            // console.log('complete_items', complete_items[j], j)
            if (!$task) continue;
            $task.addClass('completed');
            $task_list.append($task);
        }



        $task_delete_trigger = $('.action.detele');
        $task_detail_trigger = $('.action.detail');
        $checkbox_complete = $('.task-item .complete[type=checkbox]');
        listen_delete_task();
        listen_task_detail();
        listen_checkbox_complete();
    }

    /*渲染单条task模板*/
    function  render_task_item(data, index) {
        if (!data || !index) return;
        /*这里定义了一个模版*/
        // console.log(data);
        var list_item_tpl=
            '<div class="task-item" data-index="' + index + '">' +
            '<span><input class="complete" '+ (data.complete ? 'checked' : '') + ' type="checkbox"></span>' +
            '<span class="task-content">' + data.content + '</span>' +
            '<span class="fr">' +
            '<span class="action detele"> 删除</span>' +
            '<span class="action detail"> 详情</span>' +
            '</span>' +
            '</div> ';
        return $(list_item_tpl);
    }

    /*
    刷新localStorage数据并渲染render_task_tpl
    */
    function refresh_task_list() {
        store.set('task_list',task_list);
        render_task_list();
    }

    function delete_task(index) {
        //如果没有index 或者index不存在则直接返回
        if(index === undefined || !task_list[index]) return;

        delete  task_list[index];
        /* 更新localStorage*/
        refresh_task_list();
    }

    function listen_task_detail() {
        $task_detail_trigger.on('click', function () {
            var $this = $(this);
            var $item = $this.parent().parent();
            var index = $item.data('index');
            // console.log("index", index);
            show_task_detail(index);
        })
    }

    /*查看Task详情*/
    function show_task_detail(index) {
        render_task_detail(index);
        current_index = index;
        $task_detail.show();
        $task_detail_mask.show();
    }

    /*更新*/
    function update_task(index, data) {
        if (!index || !task_list[index])
            return;

        // task_list[index] = $.merge({}, task_list[index], data);
        task_list[index] = $.extend({}, task_list[index], data);
        refresh_task_list();
    }

    $task_detail_mask.on('click', function () {
        hide_task_detail();
    })

    function hide_task_detail() {
        $task_detail.hide();
        $task_detail_mask.hide();
    }
    
    function render_task_detail(index) {
        if (index === undefined || !task_list[index])
            return;
        var item = task_list[index];
        // console.log('item', item);
        var tpl =
            '<form>' +
            '<div class="content">' +
            (item.content || '') +
            '</div>' +
            '<div class="input-item">' +
            '<input style="display: none;" type="text" name="content" value="' + (item.content || '') + '">' +
            '</div>' +
            '<div>' +
            '<div class="desc input-item">' +
            '<label>备注：</label>' +
           ' <textarea name="desc">' + (item.desc || '') + '</textarea>' +
            '</div>' +
            '</div>' +
            '<div class="remind input-item">' +
            '<label>提醒时间：</label>' +
            '<input class="datetime" name="remind_date" type="text" autofocus autocomplete="off" value="' + (item.remind_date || '') + '">' +
            '</div>' +
            '<div class="input-item">' +
            '<button type="submit">更新</button>' +
            '</div>' +
            '</form>';

        $task_detail.html(null);
        $task_detail.html(tpl);
        $('.datetime').datetimepicker();

        $update_form = $task_detail.find('form');
        $task_detail_content = $update_form.find('.content');
        $task_detail_content_input = $update_form.find('[name=content]');

        //双击content
        $task_detail_content.on('dblclick', function () {
            $task_detail_content_input.show();
            $task_detail_content.hide();

        })
        $update_form.on('submit', function (e) {
            e.preventDefault();
            var data = {};
            data.content = $(this).find('[name=content]').val();
            data.desc = $(this).find('[name=desc]').val();
            data.remind_date = $(this).find('[name=remind_date]').val();
            // console.log('data', data);
            update_task(index, data);
            hide_task_detail();
        })
    }

    //checkbox
    function listen_checkbox_complete() {
        $checkbox_complete.on('click', function () {
            var $this = $(this);
            // var is_complete = $this.is(':checked');
            var index = $this.parent().parent().data('index');
            var item = get(index);
            if (item && item.complete)
                update_task(index, {complete: false});
            else
                update_task(index, {complete: true});
        })
    }

    function get(index) {
        return store.get('task_list')[index];
    }

    function pop(arg, title) {
        if (!arg)
            console.log('pop title is required');
        console.log('title', title);
        var conf = {}
            , $box
            , $mask
            , $title
            , $content
            , $title_content
            , $confirm
            , $cancel
            , timer
            , dfd
            , confirmed
        ;

        dfd = $.Deferred();
        // dfd.resolve();

        if (typeof  arg == 'string')
            conf.title = arg;
        else {
            conf = $.extend(conf, arg);
        }

        $box = $('<div>' +
            '<div class="pop-title">'+ conf.title +'</div>' +
            '<div class="pop-title-content">'+ (title.content || '') +'</div>' +
            '<div class="pop-content">' +
            '<div>' +
            '<button style="margin-right: 5px;" class="primary confirm">确认</button>' +
            '<button class="cancel">取消</button>' +
            '</div>' +
            '</div>' +
            '</div>')
            .css({
                width: 300,
                height: 'auto',
                padding: '15px 0',
                position: 'fixed',
                background: '#fff',
                'border-radius': '3px',
                'box-shadow': '0 1px 2px rgba(0,0,0,.3)'
            })


        $mask = $('<div></div>')
            .css({
                position: 'fixed',
                background: 'rgba(0,0,0,.5)',
                top: 0,
                bottom: 0,
                left: 0,
                right: 0
            })

        $title_content = $box.find('.pop-title-content').css({
            padding: '10px 0',
            color: '#000',
            'font-size': 16,
            'text-align': 'center',
        })

        $title = $box.find('.pop-title')
            .css({
                padding: '5px 10px',
                color: '#000',
                'font-weight': 900,
                'font-size': 20,
                'text-align': 'center',
            })

        $content = $box.find('.pop-content')
            .css({
                padding: '5px 10px',
                'font-weight': 900,
                'text-align': 'center',
            })

        $confirm = $content.find('button.confirm');
        $cancel = $content.find('button.cancel');

        timer = setInterval(function () {
            if (confirmed !== undefined){
                dfd.resolve(confirmed);
                clearInterval(timer);
                dismiss_pop();
            }
        }, 50)
        
        $confirm.on('click', on_confirmed);
        $cancel.on('click', on_cancel);
        $mask.on('click', on_cancel);

        function on_confirmed() {
            confirmed = true;
        }

        function on_cancel() {
            confirmed = false;
        }

        function dismiss_pop(){
            $mask.remove();
            $box.remove();
        }
        
        function adjust_box_position() {
            var window_width = $window.width()
                , window_height = $window.height()
                , box_width = $box.width()
                , box_height = $box.height()
                , move_x
                , move_y
            ;

            move_x = (window_width - box_width) / 2;
            move_y = ((window_height - box_height) / 2) - 60;

            $box.css({
                left: move_x,
                top: move_y,
            })

        }

        $window.on('resize', function () {
            adjust_box_position();
        })

        $mask.appendTo($body);
        $box.appendTo($body);
        $window.resize();
        return dfd.promise();
    }


})();